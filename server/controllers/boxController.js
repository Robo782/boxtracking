const db     = require("../db");
const logger = require("../logger");

const SERIAL_RX = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{2}$/;
const PCC_RX    = /^PCC \d{5} [A-Z]{2,3}$/;      // nur A-Z nötig – Input wird uppercase
const CHECK_RX  = /^[A-Za-z]{2,8}\d?$/;

const respondErr = (e, res) => { logger.error(e.message); res.status(500).json({ error: e.message }); };

/* ───────────────────────────── 1.  Ü B E R S I C H T  ───────────────────────────── */

/**  
 *  GET /api/boxes  
 *  Query-Parameter  
 *    • status  available | departed | returned | checked  
 *    • prefix  PU-M | PU-S | PR-M | PR-SB …   (Groß/Kleinschreibung egal)  
 */
exports.getBoxes = (req, res) => {
  const { status, prefix } = req.query;        // ← neue Filter

  let sql  = "SELECT * FROM boxes";
  const where = [];
  const args  = [];

  /* ---------- Status-Filter ---------- */
  if (status) {
    switch (status.toLowerCase()) {
      case "available":   // nichts passiert
        where.push("(departed = 0 AND returned = 0)");
        break;
      case "departed":
        where.push("departed = 1 AND returned = 0");
        break;
      case "returned":
        where.push("returned = 1 AND is_checked = 0");
        break;
      case "checked":
        where.push("is_checked = 1");
        break;
      default:
        return res.status(400).json({ error: "Unknown status filter" });
    }
  }

  /* ---------- Präfix-Filter ---------- */
  if (prefix) {
    where.push("serial LIKE ?");
    args.push(`${prefix.toUpperCase()}%`);
  }

  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY serial ASC";

  db.all(sql, args, (e, rows) => {
    if (e) return respondErr(e, res);
    res.set("Cache-Control", "no-store");
    res.json(rows);
  });
};

/* Falls du das alte „alle Boxen“ noch woanders brauchst */
exports.getAllBoxes = (_req, res) => {
  db.all("SELECT * FROM boxes ORDER BY serial ASC", [], (e, rows) => {
    if (e) return respondErr(e, res);
    res.set("Cache-Control", "no-store");
    res.json(rows);
  });
};

/* ───────────────────────────── 2.  D E T A I L ───────────────────────────── */

exports.getBox = (req, res) => {
  db.get("SELECT * FROM boxes WHERE id=?", [req.params.id], (e, row) => {
    if (e) return respondErr(e, res);
    if (!row) return res.status(404).json({ error: "Box not found" });
    res.json(row);
  });
};

/* ───────────────────────────── 3.  L I F E C Y C L E ───────────────────────────── */

exports.loadBox = (req, res) => {
  const { id } = req.params;
  let { device_serial, pcc_id } = req.body;

  device_serial = (device_serial || "").trim().toUpperCase();
  pcc_id        = (pcc_id        || "").trim().toUpperCase();

  if (!SERIAL_RX.test(device_serial)) return res.status(400).json({ error: "Serial invalid" });
  if (!PCC_RX.test(pcc_id))           return res.status(400).json({ error: "PCC ID invalid" });

  const now = new Date().toISOString();
  db.serialize(() => {
    db.run("BEGIN");
    db.run(
      `UPDATE boxes
          SET device_serial=?, departed=1, returned=0, is_checked=0, pcc_id=?
        WHERE id=?`,
      [device_serial, pcc_id, id]
    );
    db.run(
      `INSERT INTO box_history (box_id, device_serial, pcc_id, loaded_at, unloaded_at, checked_by)
       VALUES (?,?,?, ?, NULL, NULL)`,
      [id, device_serial, pcc_id, now]
    );
    db.run("COMMIT", (e) => (e ? respondErr(e, res) : res.json({ success: true })));
  });
};

exports.returnBox = (req, res) => {
  db.run(
    "UPDATE boxes SET returned=1 WHERE id=?",
    [req.params.id],
    (e) => (e ? respondErr(e, res) : res.json({ success: true }))
  );
};

exports.checkBox = (req, res) => {
  const { id } = req.params;
  let { checked_by } = req.body;
  checked_by = (checked_by || "").trim().toUpperCase();

  if (!CHECK_RX.test(checked_by)) return res.status(400).json({ error: "Checker ID invalid" });

  const now = new Date().toISOString();
  db.serialize(() => {
    db.run("BEGIN");
    /* History abschließen */
    db.run(
      `UPDATE box_history
          SET unloaded_at=?, checked_by=?
        WHERE box_id=? AND unloaded_at IS NULL`,
      [now, checked_by, id]
    );
    /* Box zurücksetzen  */
    db.run(
      `UPDATE boxes SET
          device_serial=NULL,
          pcc_id       =NULL,
          departed     =0,
          returned     =0,
          is_checked   =1,       -- ⬅ nach Prüfung TRUE
          cycles       =cycles+1
        WHERE id=?`,
      [id]
    );
    db.run("COMMIT", (e) => (e ? respondErr(e, res) : res.json({ success: true })));
  });
};

/* ───────────────────────────── 4.  H I S T O R Y ───────────────────────────── */

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
