// server/routes/boxRoutes.js
const router = require("express").Router();
const db = require("../db");
const dayjs = require("dayjs");

/* -------- Status-Automat -------- */
const NEXT = {
  available   : "departed",
  departed    : "returned",
  returned    : "available",   // Standard; wird unten bei 'damaged' überschrieben
  maintenance : "available",
  damaged     : "available",   // nach manueller Freigabe
};

/* -------- Helper: Validierungen -------- */
function isSerial(s)    { return /^[A-Za-z0-9_-]{2,}$/i.test(s); }
function isDevice(s)    { return /^[A-Za-z0-9_-]{2,}$/i.test(s); }
function isInspector(s) { return typeof s === "string" && s.trim().length >= 2; }
function isPcc(pcc)     { return /^pcc\s\d{5}\s[a-zA-Z]{2,3}$/i.test(pcc); }
const nowIso = () => dayjs().toISOString();

/* -------------------- GET /api/boxes -------------------- */
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    const lim = Number.isFinite(Number(req.query.limit)) ? Math.max(1, Math.min(500, Number(req.query.limit))) : null;
    const off = Number.isFinite(Number(req.query.offset)) ? Math.max(0, Number(req.query.offset)) : 0;

    const params = [];
    let sql = `
      SELECT id, serial, status, cycles, maintenance_count,
             device_serial, pcc_id, checked_by,
             damaged_at, damage_reason
        FROM boxes b
    `;

    if (search && String(search).trim().length > 0) {
      const term = String(search).trim();
      sql += `
        WHERE
          LOWER(b.serial)           LIKE '%' || LOWER(?) || '%'
          OR LOWER(b.pcc_id)        LIKE '%' || LOWER(?) || '%'
          OR LOWER(b.device_serial) LIKE '%' || LOWER(?) || '%'
          OR EXISTS (
                SELECT 1
                  FROM box_history h
                 WHERE h.box_id = b.id
                   AND (
                        LOWER(h.device_serial) LIKE '%' || LOWER(?) || '%'
                     OR LOWER(h.pcc_id)        LIKE '%' || LOWER(?) || '%'
                   )
          )
      `;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY b.serial `;

    if (lim) {
      sql += ` LIMIT ? OFFSET ? `;
      params.push(lim, off);
    }

    const boxes = await db.all(sql, params);
    res.json(boxes);
  } catch (err) {
    console.error("GET /boxes failed:", err);
    res.status(500).json({ error: "Failed to fetch boxes" });
  }
});

/* -------------------- GET /api/boxes/:id -------------------- */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const box = await db.get(`
      SELECT id, serial, status, cycles, maintenance_count,
             device_serial, pcc_id, checked_by,
             damaged_at, damage_reason
        FROM boxes
       WHERE id = ?
    `, [id]);
    if (!box) return res.status(404).json({ message: "Box nicht gefunden" });
    res.json(box);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fehler beim Lesen" });
  }
});

/* -------------------- PATCH /api/boxes/:id/nextStatus -------------------- */
router.patch("/:id/nextStatus", async (req, res) => {
  const { id } = req.params;
  const { inspector, device_serial, pcc_id, damaged, damage_reason,
          checklist1, checklist2, checklist3 } = req.body;

  try {
    db.raw.exec("BEGIN");

    const box = await db.get(`SELECT * FROM boxes WHERE id = ?`, [id]);
    if (!box) throw new Error("Box nicht gefunden");

    let next = null;
    const status = box.status;

    /* available -> departed (Beladen) */
    if (status === "available") {
      if (!isDevice(device_serial)) throw new Error("Geräte-Seriennummer fehlt/ungültig");
      if (!isPcc(pcc_id))           throw new Error("PCC-ID fehlt/ungültig");

      const when = nowIso();

      await db.run(
        `UPDATE boxes
            SET status = 'departed',
                device_serial = ?,
                pcc_id = ?,
                checked_by = NULL
          WHERE id = ?`,
        [device_serial.trim(), pcc_id.trim(), id]
      );

      await db.run(
        `INSERT INTO box_history (box_id, device_serial, pcc_id, loaded_at, damaged, damage_reason)
         VALUES (?, ?, ?, ?, 0, NULL)`,
        [id, device_serial.trim(), pcc_id.trim(), when]
      );

      next = "departed";
    }

    /* departed -> returned (Entladen) */
    else if (status === "departed") {
      const when = nowIso();

      await db.run(
        `UPDATE boxes
            SET status = 'returned'
          WHERE id = ?`,
        [id]
      );

      await db.run(
        `UPDATE box_history
            SET unloaded_at = ?
          WHERE id = (
            SELECT id FROM box_history
             WHERE box_id = ?
               AND loaded_at IS NOT NULL
             ORDER BY loaded_at DESC, id DESC
             LIMIT 1
          )`,
        [when, id]
      );

      next = "returned";
    }

    /* returned -> (Prüfung) -> available | damaged */
    else if (status === "returned") {
      if (!isInspector(inspector)) throw new Error("Prüfer fehlt");

      const when = nowIso();

      if (damaged) {
        if (typeof damage_reason !== "string" || damage_reason.trim().length < 3)
          throw new Error("Schadensbegründung fehlt/zu kurz");

        await db.run(
          `UPDATE boxes
              SET status = 'damaged',
                  checked_by = ?,
                  cycles = cycles + 1,
                  damaged_at = ?,
                  damage_reason = ?
            WHERE id = ?`,
          [inspector.trim(), when, damage_reason.trim(), id]
        );

        await db.run(
          `UPDATE box_history
              SET checked_by = ?,
                  damaged = 1,
                  damage_reason = ?
            WHERE id = (
              SELECT id FROM box_history
               WHERE box_id = ?
                 AND loaded_at IS NOT NULL
               ORDER BY loaded_at DESC, id DESC
               LIMIT 1
            )`,
          [inspector.trim(), damage_reason.trim(), id]
        );

        next = "damaged";
      } else {
        if (!checklist1 || !checklist2 || !checklist3)
          throw new Error("Alle Prüfpunkte müssen bestätigt sein");

        await db.run(
          `UPDATE boxes
              SET status = 'available',
                  checked_by = ?,
                  cycles = cycles + 1,
                  damaged_at = NULL,
                  damage_reason = NULL
            WHERE id = ?`,
          [inspector.trim(), id]
        );

        await db.run(
          `UPDATE box_history
              SET checked_by = ?,
                  damaged = 0,
                  damage_reason = NULL
            WHERE id = (
              SELECT id FROM box_history
               WHERE box_id = ?
                 AND loaded_at IS NOT NULL
               ORDER BY loaded_at DESC, id DESC
               LIMIT 1
            )`,
          [inspector.trim(), id]
        );

        next = "available";
      }
    }

    /* maintenance -> available */
    else if (status === "maintenance") {
      await db.run(`UPDATE boxes SET status='available' WHERE id=?`, [id]);
      next = "available";
    }

    /* damaged -> available (manuelle Freigabe nach Reparatur) */
    else if (status === "damaged") {
      await db.run(`UPDATE boxes SET status='available' WHERE id=?`, [id]);
      next = "available";
    }

    db.raw.exec("COMMIT");
    res.json({ next }); // Frontend erwartet { next }
  } catch (e) {
    db.raw.exec("ROLLBACK");
    console.error("[BOX NEXT STATUS ERROR]", e);
    res.status(400).json({ message: String(e.message || e) });
  }
});

/* -------------------- GET /api/boxes/:id/history --------------------
   Zyklus = Zeitraum von loaded_at bis zum nächsten loaded_at.
   -> Aggregation in JS (keine Window-Funktionen).
   -> Liefert zusätzlich: damaged (0/1), damaged_at (logischer Zeitpunkt), damage_reason.
--------------------------------------------------------------------- */
router.get("/:id/history", async (req, res) => {
  const { id } = req.params;
  try {
    // aktuelle Box (für damaged_at des neuesten beschädigten Zyklus)
    const box = await db.get(
      `SELECT damaged_at FROM boxes WHERE id = ?`,
      [id]
    );

    // rohe History (älteste zuerst)
    const rows = await db.all(
      `
      SELECT id, box_id, device_serial, pcc_id,
             loaded_at, unloaded_at, checked_by,
             damaged, damage_reason
        FROM box_history
       WHERE box_id = ?
       ORDER BY COALESCE(loaded_at, unloaded_at) ASC, id ASC
      `,
      [id]
    );

    const starts = rows.filter(r => r.loaded_at);
    const cycles = [];

    for (let i = 0; i < starts.length; i++) {
      const start = starts[i];
      const next  = starts[i + 1];
      const startTs = new Date(start.loaded_at).getTime();
      const endTs   = next ? new Date(next.loaded_at).getTime() : Number.POSITIVE_INFINITY;

      const win = rows.filter(r => {
        const t = new Date(r.unloaded_at || r.loaded_at || 0).getTime();
        return t >= startTs && t < endTs;
      });

      const lastUnload = win.filter(r => r.unloaded_at)
        .sort((a,b) => new Date(b.unloaded_at) - new Date(a.unloaded_at))[0];

      const lastCheck = win.filter(r => r.checked_by && r.loaded_at)
        .sort((a,b) => new Date(b.loaded_at) - new Date(a.loaded_at))[0];

      const lastDamage = win.filter(r => Number(r.damaged) === 1)
        .sort((a,b) => {
          const ta = new Date(a.loaded_at || a.unloaded_at || 0).getTime();
          const tb = new Date(b.loaded_at || b.unloaded_at || 0).getTime();
          return tb - ta;
        })[0];

      cycles.push({
        device_serial : start.device_serial || null,
        pcc_id        : start.pcc_id || null,
        loaded_at     : start.loaded_at,
        unloaded_at   : lastUnload ? lastUnload.unloaded_at : null,
        checked_by    : lastCheck ? lastCheck.checked_by : null,
        damaged       : lastDamage ? 1 : 0,
        damaged_at    : lastDamage ? ( (i === starts.length - 1 && box && box.damaged_at) ? box.damaged_at : (lastUnload && lastUnload.unloaded_at) || start.loaded_at ) : null,
        damage_reason : lastDamage ? lastDamage.damage_reason : null
      });
    }

    cycles.sort((a,b) => new Date(a.loaded_at) - new Date(b.loaded_at));
    res.json(cycles);
  } catch (err) {
    console.error("[GET /:id/history]", err);
    res.status(500).json({ message: "Verlauf konnte nicht geladen werden" });
  }
});

/* ==================== ADMIN: Direkter Box-Editor ====================
   Geschützte Endpunkte unter /api/boxes/admin[/:id]
   - GET    /api/boxes/admin?search=…    -> Liste (inkl. History-Suche)
   - POST   /api/boxes/admin             -> neue Box
   - PATCH  /api/boxes/admin/:id         -> Felder aktualisieren (Whitelist)
   - DELETE /api/boxes/admin/:id         -> Box + History löschen
===================================================================== */
const { requireAuth, requireAdmin } = (() => {
  try { return require('../middleware/authMiddleware'); }
  catch { return { requireAuth: (_req,_res,next)=>next(), requireAdmin: (_req,_res,next)=>next() }; }
})();

const ADMIN_ALLOWED = new Set([
  'serial','status','cycles','maintenance_count',
  'device_serial','pcc_id','checked_by','damaged_at','damage_reason'
]);

function buildSetClauseAdmin(payload) {
  const sets = []; const values = [];
  for (const [k,v] of Object.entries(payload||{})) {
    if (!ADMIN_ALLOWED.has(k)) continue;
    sets.push(`${k} = ?`);
    values.push(v ?? null);
  }
  if (!sets.length) return null;
  return { sets: sets.join(', '), values };
}

// GET /api/boxes/admin
router.get('/admin', requireAuth, requireAdmin, async (req,res) => {
  try {
    const { search } = req.query;
    const params = [];
    let sql = `
      SELECT id, serial, status, cycles, maintenance_count,
             device_serial, pcc_id, checked_by, damaged_at, damage_reason
        FROM boxes b
    `;
    if (search && String(search).trim()) {
      const term = String(search).trim();
      sql += `
        WHERE
          LOWER(b.serial)           LIKE '%' || LOWER(?) || '%'
          OR LOWER(b.pcc_id)        LIKE '%' || LOWER(?) || '%'
          OR LOWER(b.device_serial) LIKE '%' || LOWER(?) || '%'
          OR EXISTS (
                SELECT 1 FROM box_history h
                 WHERE h.box_id = b.id
                   AND (LOWER(h.device_serial) LIKE '%' || LOWER(?) || '%'
                     OR LOWER(h.pcc_id)        LIKE '%' || LOWER(?) || '%')
          )
      `;
      params.push(term,term,term,term,term);
    }
    sql += ` ORDER BY b.serial`;
    const rows = await db.all(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[ADMIN boxes list]', err);
    res.status(500).json({ error: 'List failed' });
  }
});

// POST /api/boxes/admin
router.post('/admin', requireAuth, requireAdmin, async (req,res) => {
  try {
    const payload = req.body || {};
    if (!payload.serial || !String(payload.serial).trim()) {
      return res.status(400).json({ error: 'serial required' });
    }
    const valid = {};
    for (const k of ADMIN_ALLOWED) if (payload[k] !== undefined) valid[k] = payload[k];
    valid.status = valid.status || 'available';
    valid.cycles = Number.isFinite(+valid.cycles) ? +valid.cycles : 0;
    valid.maintenance_count = Number.isFinite(+valid.maintenance_count) ? +valid.maintenance_count : 0;
    const cols = Object.keys(valid);
    const placeholders = cols.map(()=>'?').join(', ');
    await db.run(`INSERT INTO boxes (${cols.join(', ')}) VALUES (${placeholders})`, cols.map(k=>valid[k]));
    const row = await db.get(`SELECT id, serial, status, cycles, maintenance_count,
                                     device_serial, pcc_id, checked_by, damaged_at, damage_reason
                                FROM boxes WHERE serial = ?
                            ORDER BY id DESC LIMIT 1`, [String(payload.serial).trim()]);
    res.status(201).json(row);
  } catch (err) {
    console.error('[ADMIN boxes create]', err);
    res.status(500).json({ error: 'Create failed' });
  }
});

// PATCH /api/boxes/admin/:id
router.patch('/admin/:id', requireAuth, requireAdmin, async (req,res) => {
  try {
    const { id } = req.params;
    const built = buildSetClauseAdmin(req.body || {});
    if (!built) return res.status(400).json({ error: 'No valid fields' });
    const exist = await db.get('SELECT id FROM boxes WHERE id=?', [id]);
    if (!exist) return res.status(404).json({ error: 'Not found' });
    await db.run(`UPDATE boxes SET ${built.sets} WHERE id=?`, [...built.values, id]);
    const row = await db.get(`SELECT id, serial, status, cycles, maintenance_count,
                                     device_serial, pcc_id, checked_by, damaged_at, damage_reason
                                FROM boxes WHERE id=?`, [id]);
    res.json(row);
  } catch (err) {
    console.error('[ADMIN boxes update]', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// DELETE /api/boxes/admin/:id
router.delete('/admin/:id', requireAuth, requireAdmin, async (req,res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM box_history WHERE box_id=?', [id]);
    const r = await db.run('DELETE FROM boxes WHERE id=?', [id]);
    if ((r && r.changes) === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    console.error('[ADMIN boxes delete]', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
