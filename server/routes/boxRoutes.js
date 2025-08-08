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
function isValidDeviceSerial(serial) { return /^[A-Z0-9]{4}-\d{2}$/i.test(serial); }
function isValidPccId(pcc)           { return /^pcc\s\d{5}\s[a-zA-Z]{2,3}$/i.test(pcc); }

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
        FROM boxes
    `;

    if (search && String(search).trim().length > 0) {
      sql += `
        WHERE
          LOWER(serial)           LIKE '%' || LOWER(?) || '%'
          OR LOWER(pcc_id)        LIKE '%' || LOWER(?) || '%'
          OR LOWER(device_serial) LIKE '%' || LOWER(?) || '%'
      `;
      const term = String(search).trim();
      params.push(term, term, term);
    }

    sql += ` ORDER BY serial `;

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
  const box = await db.get(`SELECT * FROM boxes WHERE id=?`, [id]);
  if (!box) return res.status(404).json({ message: "Box nicht gefunden" });
  res.json(box);
});

/* -------------------- PATCH /api/boxes/:id/nextStatus -------------------- */
router.patch("/:id/nextStatus", async (req, res) => {
  const { id } = req.params;
  const { device_serial, pcc_id, inspector, damaged, damage_reason } = req.body;

  const box = await db.get("SELECT * FROM boxes WHERE id=?", id);
  if (!box) return res.status(404).json({ message: "Box nicht gefunden" });

  let next = NEXT[box.status];

  // Entscheidung nach Rückkehr
  if (box.status === "returned") {
    if (!inspector) return res.status(400).json({ message: "Prüfer-Kürzel fehlt" });
    if (damaged === true)      next = "damaged";
    else if (box.cycles >= 50) next = "maintenance";
    else                       next = "available";
  }
  if (!next) return res.status(400).json({ message: "Ungültiger Statuswechsel" });

  // Validierung beim Beladen
  if (box.status === "available") {
    if (!device_serial || !pcc_id) return res.status(400).json({ message: "device_serial oder pcc_id fehlt" });
    if (!isValidDeviceSerial(device_serial)) return res.status(400).json({ message: "Geräte-SN ungültig" });
    if (!isValidPccId(pcc_id))               return res.status(400).json({ message: "PCC-ID ungültig" });
  }

  try {
    db.raw.exec("BEGIN");
    const now = dayjs().toISOString();

    /* --- History-Events präzise protokollieren --- */
    if (next === "departed") {
      // Start Zyklus
      db.raw.prepare(`
        INSERT INTO box_history (box_id, device_serial, pcc_id, loaded_at)
        VALUES (?, ?, ?, ?)
      `).run(box.id, device_serial, pcc_id, now);
    }

    if (next === "returned") {
      // Ende Zyklus (nur entladen)
      db.raw.prepare(`
        INSERT INTO box_history (box_id, unloaded_at)
        VALUES (?, ?)
      `).run(box.id, now);
    }

    if (["available","maintenance","damaged"].includes(next) && box.status === "returned") {
      // Prüfabschluss (Prüfer + evtl. Beschädigung)
      db.raw.prepare(`
        INSERT INTO box_history (box_id, checked_by, damaged, damage_reason)
        VALUES (?, ?, ?, ?)
      `).run(
        box.id,
        inspector || null,
        next === "damaged" ? 1 : 0,
        next === "damaged" ? (damage_reason || null) : null
      );
    }

    /* --- Box-Objekt updaten --- */
    let cyclesInc = 0, maintInc = 0;
    let setCols = `status=?`;
    const args = [next];

    switch (next) {
      case "departed":
        setCols += `, device_serial=?, pcc_id=?, loaded_at=?, unloaded_at=NULL, checked_by=NULL, damaged_at=NULL, damage_reason=NULL`;
        args.push(device_serial, pcc_id, now);
        break;

      case "returned":
        cyclesInc = 1;
        setCols += `, unloaded_at=?`;
        args.push(now);
        break;

      case "maintenance":
        setCols += `, checked_by=?`;
        args.push(inspector || "system");
        break;

      case "available":
        if (box.status === "maintenance") maintInc = 1;
        setCols += `, checked_by=?`;
        args.push(inspector || "system");
        break;

      case "damaged":
        setCols += `, checked_by=?, damaged_at=?, damage_reason=?`;
        args.push(inspector || null, now, damage_reason || null);
        break;
    }

    if (next === "available") {
      // zurücksetzen
      setCols += `,
        device_serial=NULL, pcc_id=NULL,
        loaded_at=NULL, unloaded_at=NULL, checked_by=NULL,
        damaged_at=NULL, damage_reason=NULL`;
    }

    args.push(id);

    db.raw.prepare(`
      UPDATE boxes
         SET ${setCols},
             cycles = cycles + ${cyclesInc},
             maintenance_count = maintenance_count + ${maintInc}
       WHERE id = ?
    `).run(...args);

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
    bh.device_serial,
    bh.pcc_id,
    bh.loaded_at,
    ROW_NUMBER() OVER (PARTITION BY bh.loaded_at ORDER BY bh.id) AS rn
  FROM box_history bh
  WHERE bh.box_id = ? AND bh.loaded_at IS NOT NULL
),
loads AS (
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
      ORDER BY u.unloaded_at DESC
      LIMIT 1
    ) AS unloaded_at,

    /* letzter Prüfer im Fenster */
    (
      SELECT up.checked_by
      FROM box_history up
      WHERE up.box_id = ?
        AND up.checked_by IS NOT NULL
        AND up.id = (
          SELECT up2.id
          FROM box_history up2
          WHERE up2.box_id = up.box_id
            AND up2.checked_by IS NOT NULL
            AND (
              (up2.unloaded_at IS NOT NULL AND up2.unloaded_at >= l.start_at AND (l.next_start_at IS NULL OR up2.unloaded_at < l.next_start_at))
              OR (up2.loaded_at  IS NOT NULL AND up2.loaded_at  >= l.start_at AND (l.next_start_at IS NULL OR up2.loaded_at  < l.next_start_at))
              OR (up2.checked_by IS NOT NULL) -- reine Prüfevents ohne Zeit -> trotzdem berücksichtigen, dann per MAX(id)
            )
          ORDER BY up2.id DESC
          LIMIT 1
        )
      LIMIT 1
    ) AS checked_by,

    /* Beschädigung + Grund aus Prüfabschluss im Fenster */
    (
      SELECT COALESCE(MAX(dh.damaged),0)
      FROM box_history dh
      WHERE dh.box_id = ?
        AND dh.damaged IS NOT NULL
        AND dh.id = (
          SELECT dh2.id
          FROM box_history dh2
          WHERE dh2.box_id = dh.box_id
            AND dh2.damaged IS NOT NULL
            AND (
              (dh2.unloaded_at IS NOT NULL AND dh2.unloaded_at >= l.start_at AND (l.next_start_at IS NULL OR dh2.unloaded_at < l.next_start_at))
              OR (dh2.loaded_at  IS NOT NULL AND dh2.loaded_at  >= l.start_at AND (l.next_start_at IS NULL OR dh2.loaded_at  < l.next_start_at))
              OR (dh2.checked_by IS NOT NULL)
            )
          ORDER BY dh2.id DESC
          LIMIT 1
        )
    ) AS damaged,

    (
      SELECT dh.damage_reason
      FROM box_history dh
      WHERE dh.box_id = ?
        AND dh.damaged = 1
        AND dh.id = (
          SELECT dh2.id
          FROM box_history dh2
          WHERE dh2.box_id = dh.box_id
            AND dh2.damaged = 1
            AND (
              (dh2.unloaded_at IS NOT NULL AND dh2.unloaded_at >= l.start_at AND (l.next_start_at IS NULL OR dh2.unloaded_at < l.next_start_at))
              OR (dh2.loaded_at  IS NOT NULL AND dh2.loaded_at  >= l.start_at AND (l.next_start_at IS NULL OR dh2.loaded_at  < l.next_start_at))
              OR (dh2.checked_by IS NOT NULL)
            )
          ORDER BY dh2.id DESC
          LIMIT 1
        )
      ORDER BY dh.id DESC
      LIMIT 1
    ) AS damage_reason

  FROM loads l
)
SELECT device_serial, pcc_id, loaded_at, unloaded_at, checked_by,
       COALESCE(damaged, 0) AS damaged,
       damage_reason
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
