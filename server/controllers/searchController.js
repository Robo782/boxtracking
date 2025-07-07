const db = require("../db");
const logger = require("../logger");

/* GET /api/boxes/search?q=...  */
exports.search = (req, res) => {
  const q = (req.query.q || "").trim().toUpperCase();
  if (!q) return res.json([]);

  const like = `%${q}%`;

  const sql = `
    SELECT
      b.serial        AS box_serial,
      h.pcc_id,
      h.device_serial,
      h.checked_by
    FROM box_history h
    JOIN boxes b ON b.id = h.box_id
    WHERE UPPER(h.pcc_id)        LIKE ?
       OR UPPER(h.device_serial) LIKE ?
    ORDER BY h.loaded_at DESC
    LIMIT 100
  `;
  db.all(sql, [like, like], (e, rows) => {
    if (e) { logger.error(e.message); return res.status(500).json({ error: e.message }); }
    res.json(rows);
  });
};
