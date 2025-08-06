const router = require("express").Router();
const db = require("../db");
const path = require("path");

// 📥 SQLite-Backup herunterladen
router.get("/", (_req, res) => {
  res.download(db.DB_PATH, "backup.sqlite");
});

// 📤 Datenbank wiederherstellen
router.post("/restore", (req, res) => {
  if (!req.files?.file) {
    return res.status(400).json({ message: "Keine Datei hochgeladen" });
  }

  const upload = req.files.file;
  upload.mv(db.DB_PATH, (err) => {
    if (err) {
      return res.status(500).json({ message: "Fehler beim Speichern" });
    }
    res.json({ message: "Datenbank wiederhergestellt" });
  });
});

// 🧨 NEU: Alle Inhalte der Boxen + Historie löschen
router.delete("/clear", async (_req, res) => {
  try {
    await db.exec(`DELETE FROM box_history`);
    await db.exec(`DELETE FROM boxes`);
    res.status(204).end(); // No Content
  } catch (e) {
    console.error("[CLEAR ERROR]", e);
    res.status(500).json({ message: "Fehler beim Löschen" });
  }
});

module.exports = router;
