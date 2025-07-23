const fs   = require("fs");
const path = require("path");
const db   = require("../db");                    // liefert auch DB_FILE

/* ── Download: komplette SQLite-Datei ────────── */
exports.backupDb = (_, res) => {
  res.download(db.DB_FILE, path.basename(db.DB_FILE));
};

/* ── Restore: hochgeladenes Backup einspielen ── */
exports.restoreDb = (req, res) => {
  if (!req.file) return res.status(400).send("file missing");

  try {
    fs.copyFileSync(req.file.path, db.DB_FILE);
    res.json({ ok: true, message: "Backup eingespielt" });
  } catch (e) {
    console.error("Restore failed:", e.message);
    res.status(500).json({ error: e.message });
  }
};
