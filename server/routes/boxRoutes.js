const router = require("express").Router();
const db = require("../db");
const dayjs = require("dayjs");

const NEXT = {
  available: "departed",
  departed: "returned",
  returned: null,
  maintenance: "available",
  damaged: "available",
};

function isValidDeviceSerial(serial) {
  return /^[A-Z0-9]{4}-\d{2}$/i.test(serial);
}
function isValidPccId(pcc) {
  return /^pcc\s\d{5}\s[a-zA-Z]{2,3}$/i.test(pcc);
}

/* ------------------------------------------------------------------ */
/* GET /api/boxes                                                     */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* GET /api/boxes/:id                                                 */
/* ------------------------------------------------------------------ */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const box = await db.get(`SELECT * FROM boxes WHERE id = ?`, [id]);
  if (!box) return res.status(404).json({ message: "Box nicht gefunden" });
  res.json(box);
});

/* ------------------------------------------------------------------ */
/* PATCH /api/boxes/:id/nextStatus                                    */
/*  – behält deine bestehende Logik bei                               */
/* ------------------------------------------------------------------ */
router.patch("/:id/nextStatus", async (req, res) => {
  const { id } = req.params;
  const {
    device_serial,
    pcc_id,
    inspector,
    damaged,
    damage_reason,
    checklist1,
    checklist2,
    checklist3,
  } = req.body;

  const box = await db.get("SELECT * FROM boxes WHERE id=?", id);
  if (!box) return res.status(404).json({ message: "Box nicht gefunden" });

  let next = NEXT[box.status];

  if (box.status === "returned") {
    if (!inspector) return res.status(400).json({ message: "Prüfer-Kürzel fehlt" });

    if (damaged === true) {
      next = "damaged";
    } else if (box.cycles >= 50) {
      next = "maintenance";
    } else {
      next = "available";
    }
  }

  if (!next) return res.status(400).json({ message: "Ungültiger Statuswechsel" });

  if (box.status === "available") {
    if (!device_serial || !pcc_id)
      return res.status(400).json({ message: "device_serial oder pcc_id fehlt" });

    if (!isValidDeviceSerial(device_serial))
      return res.status(400).json({ message: "Geräte-SN ungültig" });

    if (!isValidPccId(pcc_id))
      return res.status(400).json({ message: "PCC-ID ungültig" });
  }

  try {
    db.raw.exec("BEGIN");

    // Snapshot des alten Zustands in die History
    db.raw.prepare(`
      INSERT INTO box_history
          (box_id, device_serial, pcc_id,
           loaded_at, unloaded_at, checked_by, damage_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      box.id,
      box.device_serial,
      box.pcc_id,
      box.loaded_at,
      box.unloaded_at,
      box.checked_by,
      damage_reason || null
    );

    let cyclesInc = 0;
    let maintInc = 0;
    let setCols = `status=?`;
    const args = [next];
    const now = dayjs().toISOString();

    switch (next) {
      case "departed":
        setCols += `, device_serial=?, pcc_id=?, loaded_at=?`;
        args.push(device_serial, pcc_id, now);
        break;

      case "returned":
        cyclesInc = 1;
        setCols += `, unloaded_at=?`;
        args.push(now);
        break;

      case "maintenance":
      case "available":
        setCols += `, checked_by=?`;
        args.push(inspector || "system");
        break;

      case "damaged":
        setCols += `, checked_by=?, damaged_at=?, damage_reason=?`;
        args.push(inspector, now, damage_reason || null);
        break;
    }

    if (next === "available") {
      maintInc += (box.status === "maintenance") ? 1 : 0;
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

/* ------------------------------------------------------------------ */
/* GET /api/boxes/:id/history                                         */
/*  -> NEU: Zyklus = von loaded_at bis VOR den nächsten loaded_at.    */
/*     Das passende unloaded_at wird im Fenster dazwischen gesucht.   */
/* ------------------------------------------------------------------ */
router.get("/:id/history", async (req, res) => {
  const { id } = req.params;

  try {
    // Alle History-Zeilen in zeitlicher Reihenfolge.
    // Wir verwenden COALESCE, weil manche Zeilen nur loaded_at oder nur unloaded_at tragen.
    const rows = await db.all(`
      SELECT id, device_serial, pcc_id, loaded_at, unloaded_at, checked_by
        FROM box_history
       WHERE box_id = ?
       ORDER BY COALESCE(loaded_at, unloaded_at) ASC, id ASC
    `, [id]);

    // Indizes aller Lade-Starts (Cycle-Anfänge)
    const loadIdx = [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].loaded_at) loadIdx.push(i);
    }

    const cycles = [];

    for (let i = 0; i < loadIdx.length; i++) {
      const startIndex = loadIdx[i];
      const endIndex = (i + 1 < loadIdx.length) ? loadIdx[i + 1] : rows.length;

      const startRow = rows[startIndex];

      // Suche das letzte unloaded_at zwischen startIndex (exklusiv) und endIndex (exklusiv)
      let unloadRow = null;
      for (let j = endIndex - 1; j > startIndex; j--) {
        if (rows[j].unloaded_at) {
          unloadRow = rows[j];
          break;
        }
      }

      cycles.push({
        device_serial: startRow.device_serial || "–",
        pcc_id      : startRow.pcc_id || "–",
        loaded_at   : startRow.loaded_at || null,
        unloaded_at : unloadRow ? unloadRow.unloaded_at : null,
        checked_by  : unloadRow ? (unloadRow.checked_by || "–") : "–",
      });
    }

    res.json(cycles);
  } catch (err) {
    console.error("[GET /:id/history]", err);
    res.status(500).json({ message: "Verlauf konnte nicht geladen werden" });
  }
});

module.exports = router;
