/* ------------------------------------------------------------------
   /api/boxes   –   Alle Boxen ausgeben  (später Filter & Pagination)
   ------------------------------------------------------------------ */
const router = require("express").Router();
const db     = require("../db");            // dein Promise-Wrapper

// GET /api/boxes
router.get("/", async (_req, res) => {
  try {
    const boxes = await db.all(`
      SELECT id, serial, status, cycles, pcc_id
      FROM   boxes
      ORDER  BY serial
    `);
    res.json(boxes);
  } catch (err) {
    console.error("[boxes/index]", err);
    res.status(500).json({ message: "Serverfehler" });
  }
});

module.exports = router;
