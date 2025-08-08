// server/routes/boxRoutes.js
const router = require("express").Router();
const db = require("../db");
const dayjs = require("dayjs");

const NEXT = {
  available   : "departed",
  departed    : "returned",
  returned    : null,
  maintenance : "available",
  damaged     : "available",
};

/* Helpers: Validierungen */
function isValidDeviceSerial(serial) { return /^[A-Z0-9]{4}-\d{2}$/i.test(serial); }
function isValidPccId(pcc)           { return /^pcc\s\d{5}\s[a-zA-Z]{2,3}$/i.test(pcc); }

/* --------- GET /api/boxes --------- */
router.get("/", async (_req, res) => {
  const boxes = await db.all(`
    SELECT id, serial, status, cycles, maintenance_count,
           device_serial, pcc_id, checked_by,
           damaged_at, damage_reason
      FROM boxes
     ORDER BY serial
  `);
  res.json(boxes);
});

/* --------- GET /api/boxes/:id --------- */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const box = await db.get(`SELECT * FROM boxes WHERE id=?`, [id]);
  if (!box) return res.status(404).json({ message: "Box nicht gefunden" });
  res.json(box);
});

/* --------- PATCH /api/boxes/:id/nextStatus --------- */
router.patch("/:id/nextStatus", async (req, res) => {
  const { id } = req.params;
  const { device_serial, pcc_id, inspector, damaged, damage_reason } = req.body;

  const box = await db.get("SELECT * FROM boxes WHERE id=?", id);
  if (!box) return res.status(404).json({ message: "Box nicht gefunden" });

  let next = NEXT[box.status];

  // Rückkehr-Entscheidung
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

    /* Statt generischem Snapshot: gezielte History-Events */
    if (next === "departed") {
      // Start eines Zyklus -> loaded_at
      db.raw.prepare(`
        INSERT INTO box_history (box_id, device_serial, pcc_id, loaded_at)
        VALUES (?, ?, ?, ?)
      `).run(box.id, device_serial, pcc_id, now);
    }

    if (next === "returned") {
      // Ende eines Zyklus -> unloaded_at (Prüfer kommt später)
      db.raw.prepare(`
        INSERT INTO box_history (box_id, unloaded_at)
        VALUES (?, ?)
      `).run(box.id, now);
    }

    if (["available","maintenance","damaged"].includes(next) && box.status === "returned") {
      // Prüfabschluss -> Prüfer (und evtl. beschädigt) als eigenes Event
      db.raw.prepare(`
        INSERT INTO box_history (box_id, checked_by, damaged, damage_reason)
        VALUES (?, ?, ?, ?)
      `).run(box.id, inspector || null, next === "damaged" ? 1 : 0, next === "damaged" ? (damage_reason || null) : null);
    }

    /* Box aktualisieren */
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
      // Reset der Nutzdaten
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

/* --------- GET /api/boxes/:id/history ---------
   Zyklus = distinct loaded_at (rn=1) bis vor nächsten loaded_at.
   In diesem Fenster:
     - letzte unloaded_at
     - letzte checked_by
     - damaged = 1, reason falls vorhanden
------------------------------------------------- */
router.get("/:id/history", async (req, res) => {
  const { id } = req.params;

  try {
    const rows = await db.all(
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

    /* Letztes Entladen im Fenster */
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

    /* Letzter Prüfer im Fenster */
    (
      SELECT up.checked_by
      FROM box_history up
      WHERE up.box_id = ?
        AND up.checked_by IS NOT NULL
        AND (
          -- zeitlich zwischen Start und nächstem Start,
          -- wir benutzen COALESCE, weil Prüf-Events keinen Zeitstempel haben
          1 = 1
        )
        AND EXISTS (
          SELECT 1
          FROM box_history t
          WHERE t.box_id = up.box_id
            AND (
              (t.unloaded_at IS NOT NULL AND t.unloaded_at >= l.start_at AND (l.next_start_at IS NULL OR t.unloaded_at < l.next_start_at))
              OR (t.loaded_at  IS NOT NULL AND t.loaded_at  >= l.start_at AND (l.next_start_at IS NULL OR t.loaded_at  < l.next_start_at))
            )
            AND t.id = up.id
        )
      ORDER BY up.id DESC
      LIMIT 1
    ) AS checked_by,

    /* Beschädigung im Fenster? */
    (
      SELECT MAX(dh.damaged) -- 0/1
      FROM box_history dh
      WHERE dh.box_id = ?
        AND dh.damaged IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM box_history t
          WHERE t.box_id = dh.box_id
            AND (
              (t.unloaded_at IS NOT NULL AND t.unloaded_at >= l.start_at AND (l.next_start_at IS NULL OR t.unloaded_at < l.next_start_at))
              OR (t.loaded_at  IS NOT NULL AND t.loaded_at  >= l.start_at AND (l.next_start_at IS NULL OR t.loaded_at  < l.next_start_at))
            )
            AND t.id = dh.id
        )
    ) AS damaged,

    (
      SELECT dh.damage_reason
      FROM box_history dh
      WHERE dh.box_id = ?
        AND dh.damaged = 1
        AND EXISTS (
          SELECT 1
          FROM box_history t
          WHERE t.box_id = dh.box_id
            AND (
              (t.unloaded_at IS NOT NULL AND t.unloaded_at >= l.start_at AND (l.next_start_at IS NULL OR t.unloaded_at < l.next_start_at))
              OR (t.loaded_at  IS NOT NULL AND t.loaded_at  >= l.start_at AND (l.next_start_at IS NULL OR t.loaded_at  < l.next_start_at))
            )
            AND t.id = dh.id
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

    res.json(rows);
  } catch (err) {
    console.error("[GET /:id/history]", err);
    res.status(500).json({ message: "Verlauf konnte nicht geladen werden" });
  }
});

module.exports = router;
