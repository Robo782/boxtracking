const db     = require("../db");
const logger = require("../logger");

const SERIAL_RX = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{2}$/;
const PCC_RX    = /^PCC \d{5} [A-Z]{2,3}$/;          // nur A-Z nötig – Input wird uppercase
const CHECK_RX  = /^[A-Za-z]{2,8}\d?$/;

const respondErr = (e, res) => { logger.error(e.message); res.status(500).json({ error: e.message }); };

/* ---------- Übersicht ---------- */
exports.getAllBoxes = (req, res) => {
  db.all("SELECT * FROM boxes ORDER BY serial ASC", [], (e, rows) => {
    if (e) return respondErr(e, res);
    res.set("Cache-Control", "no-store");
    res.json(rows);
  });
};

/* ---------- Detail ---------- */
exports.getBox = (req, res) => {
  db.get("SELECT * FROM boxes WHERE id=?", [req.params.id], (e, row) => {
    if (e) return respondErr(e, res);
    if (!row) return res.status(404).json({ error: "Box not found" });
    res.json(row);
  });
};

/* ---------- Beladen ---------- */
exports.loadBox = (req, res) => {
  const { id } = req.params;
  let { device_serial, pcc_id } = req.body;

  device_serial = (device_serial || "").trim().toUpperCase();
  pcc_id        = (pcc_id        || "").trim().toUpperCase();

  if (!SERIAL_RX.test(device_serial)) return res.status(400).json({ error: "Serial invalid" });
  if (!PCC_RX.test(pcc_id))           return res.status(400).json({ error: "PCC ID invalid" });

  const now = new Date().toISOString();
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run(
      `UPDATE boxes SET device_serial=?, departed=1, pcc_id=? WHERE id=?`,
      [device_serial, pcc_id, id]
    );
    db.run(
      `INSERT INTO box_history (box_id, device_serial, pcc_id, loaded_at, checked_by)
       VALUES (?,?,?,?,NULL)`,
      [id, device_serial, pcc_id, now]
    );
    db.run("COMMIT", (e) => (e ? respondErr(e, res) : res.json({ success: true })));
  });
};

/* ---------- Rückkehr ---------- */
exports.returnBox = (req, res) => {
  db.run("UPDATE boxes SET returned=1 WHERE id=?", [req.params.id], (e) =>
    e ? respondErr(e, res) : res.json({ success: true })
  );
};

/* ---------- Prüfung ---------- */
exports.checkBox = (req, res) => {
  const { id } = req.params;
  let { checked_by } = req.body;
  checked_by = (checked_by || "").trim().toUpperCase();

  if (!CHECK_RX.test(checked_by)) return res.status(400).json({ error: "Checker ID invalid" });

  const now = new Date().toISOString();
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run(
      `UPDATE box_history
          SET unloaded_at=?, checked_by=?
        WHERE box_id=? AND unloaded_at IS NULL`,
      [now, checked_by, id]
    );
    db.run(
      `UPDATE boxes SET
          device_serial=NULL,
          pcc_id      =NULL,
          departed    =0,
          returned    =0,
          is_checked  =0,
          cycles      =cycles+1
        WHERE id=?`,
      [id]
    );
    db.run("COMMIT", (e) => (e ? respondErr(e, res) : res.json({ success: true })));
  });
};

/* ---------- Historie ---------- */
exports.getHistory = (req, res) => {
  db.all(
    `SELECT device_serial, pcc_id, loaded_at, unloaded_at, checked_by
       FROM box_history
      WHERE box_id=?
      ORDER BY loaded_at DESC`,
    [req.params.id],
    (e, rows) => (e ? respondErr(e, res) : res.json(rows))
  );
};
