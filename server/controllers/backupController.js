// ------------------------------------------------------------
//  einfache Endpunkte für Backup & Restore
// ------------------------------------------------------------
const path = require("path");
const fs   = require("fs");
const db   = require("../db");             // nur um an DB_PATH zu kommen

/**
 * GET /api/backup/download
 * Lädt die aktuelle Datenbank als Datei herunter.
 */
exports.download = (req, res) => {
  const filePath = db.DB_PATH;             // absoluter Pfad zur DB-Datei

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Datenbank-Datei nicht gefunden");
  }
  // Dateiname, den der Browser anzeigen soll
  const downloadName = "boxtracker.sqlite";

  res.download(filePath, downloadName, (err) => {
    if (err) {
      console.error("❌ Fehler beim DB-Download:", err);
      if (!res.headersSent) res.status(500).send("Interner Serverfehler");
    }
  });
};
