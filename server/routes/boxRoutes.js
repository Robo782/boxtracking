const router = require("express").Router();
const db     = require("../db");

/* ---------- Helfer --------------------------------------------------- */
const NEXT = {
  available   : "departed",
  departed    : "returned",
  returned    : "maintenance",
  maintenance : "available",
};

/* GET /api/boxes ------------------------------------------------------- */
router.get("/", async (_req, res) => {
  const boxes = await db.all(`
      SELECT id, serial, status, cycles, maintenance_count
        FROM boxes
       ORDER BY serial
  `);
  res.json(boxes);
});

/* PATCH /api/boxes/:id/nextStatus ------------------------------------- */
router.patch("/:id/nextStatus", async (req, res) => {
  const { id } = req.params;

  const box = await db.get(`SELECT * FROM boxes WHERE id=?`, id);
  if (!box) return res.status(404).json({ message: "Box nicht gefunden" });

  const next = NEXT[box.status];
  if (!next) return res.status(400).json({ message: "Ungültiger Status" });

  /* — Transaktion — */
  try {
    db.raw.exec("BEGIN");

    /* History schreiben */
    db.raw.prepare(`
      INSERT INTO box_history
      (box_id, device_serial, pcc_id, loaded_at, unloaded_at, checked_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      box.id,
      box.device_serial,
      box.pcc_id,
      box.loaded_at,
      box.unloaded_at,
      req.user?.id ?? null            // falls Auth vorhanden
    );

    /* Zähler anpassen */
    let cyclesInc = 0, maintInc = 0;
    if (next === "returned")     cyclesInc   = 1;
    if (next === "available")    maintInc    = box.status === "maintenance" ? 1 : 0;

    db.raw.prepare(`
      UPDATE boxes
         SET status            = ?,
             cycles            = cycles + ?,
             maintenance_count = maintenance_count + ?
       WHERE id = ?
    `).run(next, cyclesInc, maintInc, box.id);

    db.raw.exec("COMMIT");
    res.json({ id: box.id, next });
  } catch (e) {
    db.raw.exec("ROLLBACK");
    console.error("[boxes/nextStatus]", e);
    res.status(500).json({ message: "Update fehlgeschlagen" });
  }
});

module.exports = router;
