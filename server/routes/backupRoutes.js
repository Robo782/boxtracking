// server/routes/backupRoutes.js
const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const db = require("../db");

const DB_PATH = db.DB_PATH;

// Backup: aktuelle DB-Datei als Download
router.get("/", (_req, res) => {
  res.download(DB_PATH, "backup.sqlite");
});

// Restore: DB ersetzen durch Upload
router.post("/restore", (req, res) => {
  if (!req.files?.file)
    return res.status(400).json({ message: "Keine Datei hochgeladen" });

  const upload = req.files.file;
  upload.mv(DB_PATH, err => {
    if (err) return res.status(500).json({ message: "Fehler beim Speichern" });
    res.json({ message: "Wiederherstellung erfolgreich" });
  });
});

// ✅ NEU: Inhalte der Tabellen löschen, Struktur beibehalten
router.delete("/clear", async (_req, res) => {
  try {
    await db.exec(`DELETE FROM box_history`);
    await db.exec(`DELETE FROM boxes`);
    res.status(204).end(); // No Content
  } catch (e) {
    console.error("[BACKUP CLEAR ERROR]", e);
    res.status(500).json({ message: "Fehler beim Löschen der Inhalte" });
  }
});

module.exports = router;
