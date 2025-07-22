const db = require("../db");

const MAX_CYCLES = 50;

/* Hilfs-Funktionen */
const getBox = (id) =>
  db.get("SELECT * FROM boxes WHERE id = ?", id);

const addHistory = (b) =>
  db.run(
    `INSERT INTO box_history
       (box_id, device_serial, pcc_id, loaded_at, unloaded_at, checked_by)
     VALUES (?,?,?,?,?,?)`,
    [b.id, b.device_serial, b.pcc_id, b.loaded_at, b.unloaded_at, b.checked_by]
  );

/* ───────────────────────────────────────────────────────── */

exports.getAll = async (_, res) => {
  const rows = await db.all(`
    SELECT id, serial, status, cycles, maintenance_count,
           device_serial, pcc_id
    FROM boxes ORDER BY serial`);
  res.json(rows);
};

exports.getOne = async (req, res) => {
  const b = await getBox(req.params.id);
  if (!b) return res.status(404).send("Box not found");
  res.json(b);
};

exports.history = async (req, res) => {
  const rows = await db.all(
    `SELECT device_serial,pcc_id,loaded_at,unloaded_at,checked_by
       FROM box_history
      WHERE box_id = ?
      ORDER BY loaded_at DESC`,
    req.params.id
  );
  res.json(rows);
};

/* ───────── Status-Wechsel ───────── */

exports.load = async (req, res) => {
  const { device_serial, pcc_id } = req.body;
  if (!device_serial || !pcc_id)
    return res.status(400).send("device_serial & pcc_id erforderlich");

  const b = await getBox(req.params.id);
  if (!b || b.status !== "available")
    return res.status(400).send("Box nicht verfügbar");

  const newCycles  = b.cycles + 1;
  const newStatus  = newCycles >= MAX_CYCLES ? "maintenance" : "departed";

  await db.run(
    `UPDATE boxes
       SET status        = ?,
           cycles        = ?,
           device_serial = ?,
           pcc_id        = ?,
           loaded_at     = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [newStatus, newCycles, device_serial, pcc_id, b.id]
  );

  res.json({ status: newStatus });
};

exports.returnBox = async (req, res) => {
  const b = await getBox(req.params.id);
  if (!b || b.status !== "departed")
    return res.status(400).send("Box ist nicht unterwegs");

  await db.run(
    `UPDATE boxes
       SET status='returned',
           unloaded_at=CURRENT_TIMESTAMP
     WHERE id = ?`,
    b.id
  );
  res.json({ status: "returned" });
};

exports.check = async (req, res) => {
  const { checked_by } = req.body;
  if (!checked_by) return res.status(400).send("checked_by fehlt");

  const b = await getBox(req.params.id);
  if (!b || b.status !== "returned")
    return res.status(400).send("Box nicht im Status 'returned'");

  await addHistory(b);

  await db.run(
    `UPDATE boxes
       SET status='available',
           device_serial=NULL,
           pcc_id=NULL,
           loaded_at=NULL,
           unloaded_at=NULL,
           checked_by=NULL
     WHERE id = ?`,
    b.id
  );
  res.json({ status: "available" });
};

exports.done = async (req, res) => {
  const b = await getBox(req.params.id);
  if (!b || b.status !== "maintenance")
    return res.status(400).send("Box nicht in Wartung");

  await db.run(
    `UPDATE boxes
       SET status='available',
           cycles=0,
           maintenance_count = maintenance_count + 1
     WHERE id = ?`,
    b.id
  );
  res.json({ status: "available" });
};
