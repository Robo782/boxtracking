// server/controllers/boxController.js
const db = require("../db");        // better-sqlite3 – synchron!
const MAX_CYCLES = 50;

/* ───────── Hilfsfunktionen ───────── */

const getBox = (id) =>
  db.prepare("SELECT * FROM boxes WHERE id = ?").get(id);

const addHistory = (b) =>
  db.prepare(
    `INSERT INTO box_history
       (box_id, device_serial, pcc_id, loaded_at, unloaded_at, checked_by)
     VALUES (?,?,?,?,?,?)`
  ).run(b.id, b.device_serial, b.pcc_id, b.loaded_at, b.unloaded_at, b.checked_by);

/* ──────────────────────────────────── */

/**
 * GET /api/boxes
 */
exports.getAll = (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, serial, status, cycles, maintenance_count,
              device_serial, pcc_id
         FROM boxes
     ORDER BY serial`
    )
    .all();
  res.json(rows);
};

/**
 * GET /api/boxes/:id
 */
exports.getOne = (req, res) => {
  const box = getBox(req.params.id);
  if (!box) return res.status(404).send("Box not found");
  res.json(box);
};

/**
 * GET /api/boxes/:id/history
 */
exports.history = (req, res) => {
  const rows = db
    .prepare(
      `SELECT device_serial, pcc_id,
              loaded_at, unloaded_at, checked_by
         FROM box_history
        WHERE box_id = ?
     ORDER BY loaded_at DESC`
    )
    .all(req.params.id);

  res.json(rows);
};

/* ───────── Status-Wechsel ───────── */

/**
 * POST /api/boxes/:id/load
 * Body: { device_serial, pcc_id }
 */
exports.load = (req, res) => {
  const { device_serial, pcc_id } = req.body;
  if (!device_serial || !pcc_id)
    return res.status(400).send("device_serial & pcc_id erforderlich");

  const b = getBox(req.params.id);
  if (!b || b.status !== "available")
    return res.status(400).send("Box nicht verfügbar");

  const newCycles = b.cycles + 1;
  const newStatus = newCycles >= MAX_CYCLES ? "maintenance" : "departed";

  db.prepare(
    `UPDATE boxes SET
         status        = ?,
         cycles        = ?,
         device_serial = ?,
         pcc_id        = ?,
         loaded_at     = CURRENT_TIMESTAMP
       WHERE id = ?`
  ).run(newStatus, newCycles, device_serial, pcc_id, b.id);

  res.json({ status: newStatus });
};

/**
 * POST /api/boxes/:id/return
 */
exports.returnBox = (req, res) => {
  const b = getBox(req.params.id);
  if (!b || b.status !== "departed")
    return res.status(400).send("Box ist nicht unterwegs");

  db.prepare(
    `UPDATE boxes SET
         status      = 'returned',
         unloaded_at = CURRENT_TIMESTAMP
       WHERE id = ?`
  ).run(b.id);

  res.json({ status: "returned" });
};

/**
 * POST /api/boxes/:id/check
 * Body: { checked_by }
 */
exports.check = (req, res) => {
  const { checked_by } = req.body;
  if (!checked_by) return res.status(400).send("checked_by fehlt");

  const b = getBox(req.params.id);
  if (!b || b.status !== "returned")
    return res.status(400).send("Box nicht im Status 'returned'");

  addHistory({ ...b, checked_by });

  db.prepare(
    `UPDATE boxes SET
         status        = 'available',
         device_serial = NULL,
         pcc_id        = NULL,
         loaded_at     = NULL,
         unloaded_at   = NULL,
         checked_by    = NULL
       WHERE id = ?`
  ).run(b.id);

  res.json({ status: "available" });
};

/**
 * POST /api/boxes/:id/done   (Wartung beendet)
 */
exports.done = (req, res) => {
  const b = getBox(req.params.id);
  if (!b || b.status !== "maintenance")
    return res.status(400).send("Box nicht in Wartung");

  db.prepare(
    `UPDATE boxes SET
         status            = 'available',
         cycles            = 0,
         maintenance_count = maintenance_count + 1
       WHERE id = ?`
  ).run(b.id);

  res.json({ status: "available" });
};
