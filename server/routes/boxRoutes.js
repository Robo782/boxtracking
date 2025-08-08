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
router.get("/:id/history", async (req, res) => {
  const { id } = req.params;

  try {
    const cycles = await db.all(
      `
WITH load_rows AS (
  SELECT
    bh.id,
    bh.box_id,
    bh.device_serial,
    bh.pcc_id,
    bh.loaded_at,
    ROW_NUMBER() OVER (PARTITION BY bh.loaded_at ORDER BY bh.id) AS rn
  FROM box_history bh
  WHERE bh.box_id = ?
    AND bh.loaded_at IS NOT NULL
),
starts AS (
  SELECT
    lr.id,
    lr.device_serial,
    lr.pcc_id,
    lr.loaded_at AS start_at,
    LEAD(lr.loaded_at) OVER (ORDER BY lr.loaded_at, lr.id) AS next_start_at
  FROM load_rows lr
  WHERE lr.rn = 1
),
paired AS (
  SELECT
    l.device_serial,
    l.pcc_id,
    l.start_at AS loaded_at,

    /* letztes Entladen im Fenster */
    (
      SELECT u.unloaded_at
      FROM box_history u
      WHERE u.box_id = ?
        AND u.unloaded_at IS NOT NULL
        AND u.unloaded_at >= l.start_at
        AND (l.next_start_at IS NULL OR u.unloaded_at < l.next_start_at)
      ORDER BY u.unloaded_at DESC, u.id DESC
      LIMIT 1
    ) AS unloaded_at,

    /* letzter Prüfer im Fenster */
    (
      SELECT c.checked_by
      FROM box_history c
      WHERE c.box_id = ?
        AND c.checked_by IS NOT NULL
        AND c.loaded_at >= l.start_at
        AND (l.next_start_at IS NULL OR c.loaded_at < l.next_start_at)
      ORDER BY c.loaded_at DESC, c.id DESC
      LIMIT 1
    ) AS checked_by,

    /* Schaden im Fenster */
    (
      SELECT d.damaged_at
      FROM box_history d
      WHERE d.box_id = ?
        AND d.damaged_at IS NOT NULL
        AND d.loaded_at >= l.start_at
        AND (l.next_start_at IS NULL OR d.loaded_at < l.next_start_at)
      ORDER BY d.damaged_at DESC, d.id DESC
      LIMIT 1
    ) AS damaged_at,

    (
      SELECT d.damage_reason
      FROM box_history d
      WHERE d.box_id = ?
        AND d.damage_reason IS NOT NULL
        AND d.loaded_at >= l.start_at
        AND (l.next_start_at IS NULL OR d.loaded_at < l.next_start_at)
      ORDER BY d.damaged_at DESC, d.id DESC
      LIMIT 1
    ) AS damage_reason
  FROM starts l
)
SELECT *
FROM paired
ORDER BY loaded_at ASC
      `,
      [id, id, id, id, id]
    );

    res.json(cycles);
  } catch (err) {
    console.error("[GET /:id/history]", err);
    res.status(500).json({ message: "Verlauf konnte nicht geladen werden" });
  }
});

module.exports = router;
