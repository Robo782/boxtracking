// server/routes/boxRoutes.js
const router = require("express").Router();
const db = require("../db");
const dayjs = require("dayjs");

/* -------- Status-Automat -------- */
const NEXT = {
  available   : "departed",
  departed    : "returned",
  returned    : null,
  maintenance : "available",
  damaged     : "available",
};

/* -------- Helper: Validierungen -------- */
function isSerial(s)   { return /^[A-Za-z0-9_-]{2,}$/i.test(s); }
function isDevice(s)   { return /^[A-Za-z0-9_-]{2,}$/i.test(s); }
function isInspector(s){ return typeof s === "string" && s.trim().length >= 2; }
function isPcc(pcc)    { return /^pcc\s\d{5}\s[a-zA-Z]{2,3}$/i.test(pcc); }

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
      const term = String(search).trim();
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
// (deine bestehende Next-Status-Logik bleibt 1:1 erhalten – hier gekürzt dargestellt)
router.patch("/:id/nextStatus", async (req, res) => {
  const { id } = req.params;
  const { inspector, device_serial, pcc_id, damaged, damage_reason,
          checklist1, checklist2, checklist3 } = req.body;

  // ... vollständige Validierung & Transaktion (unverändert)
  try {
    db.raw.exec("BEGIN");

    const box = await db.get(`SELECT * FROM boxes WHERE id = ?`, [id]);
    if (!box) throw new Error("Box nicht gefunden");

    const next = NEXT[box.status];
    if (!next) throw new Error("Kein nächster Status");

    // Beispiel für deine bestehende Logik:
    // - cycles hochzählen beim returned
    // - Wartung/Inspektion/Damaged behandeln
    // - Historie schreiben (box_history)
    // - checked_by setzen usw.
    // ... (hier im Upload gekürzt)

    db.raw.exec("COMMIT");
    res.json({ id: box.id, next });
  } catch (e) {
    db.raw.exec("ROLLBACK");
    console.error("[BOX STATUS ERROR]", e);
    res.status(500).json({ message: "Update fehlgeschlagen" });
  }
});

/* -------------------- GET /api/boxes/:id/history --------------------
   Zyklus = DISTINCT loaded_at (erste Zeile je Zeitpunkt).
   Im Zeitfenster [start, next_start):
     - letztes unloaded_at
     - letzter checked_by
     - damaged + damage_reason (falls gesetzt)
--------------------------------------------------------------------- */
/* -------------------- GET /api/boxes/:id/history --------------------
   Zyklus = Zeitraum von loaded_at bis zum nächsten loaded_at.
   Wir laden rohe History-Einträge und bauen die Zyklen in JS zusammen.
--------------------------------------------------------------------- */
/* -------------------- GET /api/boxes/:id/history --------------------
   Zyklus = Zeitraum von loaded_at bis zum nächsten loaded_at.
   Wir laden rohe History-Einträge und bauen die Zyklen in JS zusammen.
--------------------------------------------------------------------- */
router.get("/:id/history", async (req, res) => {
  const { id } = req.params;
  try {
    // Alle History-Einträge der Box laden (älteste zuerst)
    const rows = await db.all(
      `
      SELECT id, box_id, device_serial, pcc_id,
             loaded_at, unloaded_at, checked_by,
             damaged_at, damage_reason
        FROM box_history
       WHERE box_id = ?
       ORDER BY 
         COALESCE(loaded_at, unloaded_at, damaged_at) ASC,
         id ASC
      `,
      [id]
    );

    // Startpunkte = alle Einträge mit loaded_at
    const starts = rows.filter(r => r.loaded_at);

    const cycles = [];
    for (let i = 0; i < starts.length; i++) {
      const start = starts[i];
      const next  = starts[i + 1];
      const startTs = new Date(start.loaded_at).getTime();
      const endTs   = next ? new Date(next.loaded_at).getTime() : Number.POSITIVE_INFINITY;

      // Fenster [start, nextStart)
      const inWindow = rows.filter(r => {
        const t = new Date(r.unloaded_at || r.loaded_at || r.damaged_at || 0).getTime();
        return t >= startTs && t < endTs;
      });

      // letzter Unload / Check / Schaden im Fenster
      const lastUnload = inWindow.filter(r => r.unloaded_at)
        .sort((a,b) => new Date(b.unloaded_at) - new Date(a.unloaded_at))[0];
      const lastCheck  = inWindow.filter(r => r.checked_by && r.loaded_at)
        .sort((a,b) => new Date(b.loaded_at) - new Date(a.loaded_at))[0];
      const lastDamage = inWindow.filter(r => r.damaged_at)
        .sort((a,b) => new Date(b.damaged_at) - new Date(a.damaged_at))[0];

      cycles.push({
        device_serial : start.device_serial || null,
        pcc_id        : start.pcc_id || null,
        loaded_at     : start.loaded_at,
        unloaded_at   : lastUnload ? lastUnload.unloaded_at : null,
        checked_by    : lastCheck ? lastCheck.checked_by : null,
        damaged_at    : lastDamage ? lastDamage.damaged_at : null,
        damage_reason : lastDamage ? lastDamage.damage_reason : null,
      });
    }

    cycles.sort((a,b) => new Date(a.loaded_at) - new Date(b.loaded_at));
    res.json(cycles);
  } catch (err) {
    console.error("[GET /:id/history]", err);
    res.status(500).json({ message: "Verlauf konnte nicht geladen werden" });
  }
});


module.exports = router;
