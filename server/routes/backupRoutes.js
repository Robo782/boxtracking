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
// Leert alle relevanten Tabellen – aber löscht nicht die Struktur
router.delete("/clear", async (req, res) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Nur Admins dürfen das durchführen" });
  }

  try {
    db.raw.exec("DELETE FROM box_history;");
    db.raw.exec("DELETE FROM boxes;");
    res.json({ message: "Alle Daten erfolgreich gelöscht." });
  } catch (err) {
    console.error("[DELETE /backup/clear]", err);
    res.status(500).json({ message: "Fehler beim Löschen der Daten." });
  }
});

module.exports = router;
