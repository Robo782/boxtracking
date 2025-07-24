/**
 * Klein & simpel:
 *  GET /api/backup/download   →  sendet die aktuelle SQLite-Datei
 */
const express = require("express");
const router  = express.Router();
const { DB_PATH } = require("../db");
const path = require("path");

router.get("/download", (_req, res) => {
  res.download(DB_PATH, path.basename(DB_PATH), (err) => {
    if (err) {
      console.error("❌ Backup-Download fehlgeschlagen:", err);
      if (!res.headersSent) res.status(500).send("Backup-Download fehlgeschlagen");
    }
  });
});

module.exports = router;
