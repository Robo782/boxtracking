const router = require("express").Router();
const db     = require("../db");
const dayjs  = require("dayjs");

const NEXT = {
  available   : "departed",
  departed    : "returned",
  returned    : "maintenance",
  maintenance : "available",
};

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
  const { id }                     = req.params;
  const { device_serial, pcc_id,
          inspector }              = req.body; // Kürzel bei returned
  const userId = req.user?.id ?? null;         // JWT-Claim, falls vorhanden

  const box = await db.get("SELECT * FROM boxes WHERE id=?", id);
  if (!box) return res.status(404).json({ message: "Box nicht gefunden" });

  const next = NEXT[box.status];
  if (!next) return res.status(400).json({ message: "Ungültiger Status" });

  /* ---------- Business-Regeln --------------------------------------- */
  if (box.status === "available") {
    if (!device_serial || !pcc_id)
      return res.status(400).json({ message: "device_serial oder pcc_id fehlt" });
  }

  if (box.status === "departed") {
    // nichts Besonderes
  }

  if (box.status === "returned") {
    if (box.cycles + 1 < 50)
      return res.status(400).json({ message: "50 Zyklen noch nicht erreicht" });
    if (!inspector)
      return res.status(400).json({ message: "Prüfer-Kürzel fehlt" });
  }

  /* ---------- Transaktion ------------------------------------------- */
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
        setCols  += `, checked_by=?`;
        args.push(inspector);
        break;

      case "available":
        maintInc = 1;
        setCols += `,
          device_serial=NULL, pcc_id=NULL,
          loaded_at=NULL, unloaded_at=NULL, checked_by=NULL`;
        break;
    }

    args.push(box.id);

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
