const express = require("express");
const router  = express.Router();
const backup  = require("../controllers/backupController");

// GET  /api/backup/download   → SQLite-Datei herunterladen
router.get("/download", backup.download);

module.exports = router;
