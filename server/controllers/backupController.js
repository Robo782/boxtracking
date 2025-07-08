// server/controllers/backupController.js
const path   = require("path");
const fs     = require("fs");
const util   = require("util");
const dbPath = path.join(__dirname, "..", "db", "database.sqlite");

/* ----------  GET /api/admin/backup  ----------
   Sendet die aktuelle DB-Datei als Download     */
exports.backupDb = (req, res) => {
  const stamp  = new Date().toISOString().replace(/[:.]/g, "-");
  const fname  = `backup-${stamp}.sqlite`;
  res.download(dbPath, fname);
};

/* ----------  POST /api/admin/restore  ----------
   Erwartet multipart/form-data  field = file
   Überschreibt die produktive DB                  */
exports.restoreDb = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No file uploaded" });

  const tmp = req.file.path;
  try {
    await util.promisify(fs.copyFile)(tmp, dbPath);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Restore failed" });
  } finally {
    fs.unlink(tmp, ()=>{});
  }
};
