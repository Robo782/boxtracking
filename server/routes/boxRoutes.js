const router = require("express").Router();
const db     = require("../db");
const dayjs  = require("dayjs");

const NEXT = {
  available   : "departed",
  departed    : "returned",
  returned    : null,         // wird dynamisch gesetzt!
  maintenance : "available",
};

// Formatvalidierung
function isValidDeviceSerial(serial) {
  return /^[A-Z0-9]{4}-\d{2}$/i.test(serial);
}
function isValidPccId(pcc) {
  return /^pcc\s\d{5}\s[a-zA-Z]{2,3}$/i.test(pcc);
}

/* ---------- GET /api/boxes ------------------------------------------- */
router.get("/", async (_req, res) => {
  const boxes = await db.all(`
    SELECT id, serial, status, cycles, maintenance_count,
           device_serial, pcc_id, checked_by
      FROM boxes
     ORDER BY serial
  `);
  res.json(boxes);
});

/* ---------- PATCH /api/boxes/:id/nextStatus -------------------------- */
router.patch("/:id/nextStatus", async (req, res) => {
  const { id } = req.params;
  const {
    device_serial, pcc_id,
    inspector,
    damaged,
    checklist1, checklist2, checklist3
  } = req.body;

  const box = await db.get("SELECT * FROM boxes WHERE id=?", id);
  if (!box) return res.status(404).json({ message: "Box nicht gefunden" });

  let next = NEXT[box.status];

  if (box.status === "returned") {
    if (!inspector) return res.status(400).json({ message: "Prüfer-Kürzel fehlt" });
    if (damaged) {
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

    db.raw.prepare(`
      INSERT INTO box_history
          (box_id, device_serial, pcc_id,
           loaded_at, unloaded_at, checked_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      box.id,
      box.device_serial,
      box.pcc_id,
      box.loaded_at,
      box.unloaded_at,
      box.checked_by
    );

    let cyclesInc = 0,
        maintInc  = 0,
        setCols   = `status=?`,
        args      = [ next ];

    const now = dayjs().toISOString();

    switch (next) {
      case "departed":
        setCols += `, device_serial=?, pcc_id=?, loaded_at=?`;
        args.push(device_serial, pcc_id, now);
        break;

      case "returned":
        cyclesInc = 1;
        setCols  += `, unloaded_at=?`;
        args.push(now);
        break;

      case "maintenance":
      case "available":
      case "damaged":
        setCols += `, checked_by=?`;
        args.push(inspector);
        break;
    }

    if (next === "available") {
      maintInc += (box.status === "maintenance") ? 1 : 0;
      setCols += `,
        device_serial=NULL, pcc_id=NULL,
        loaded_at=NULL, unloaded_at=NULL, checked_by=NULL`;
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
    console.error("[boxes/nextStatus]", e);
    res.status(500).json({ message: "Update fehlgeschlagen" });
  }
});

module.exports = router;
