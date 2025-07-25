// server/index.js
// ────────────────────────────────────────────────────────────────────
const express  = require("express");
const cors     = require("cors");
const path     = require("path");
const fs       = require("fs");
const multer   = require("multer");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Statische Dateien (Spa-Build) ─────────────────────────────────
app.use(express.static(path.join(__dirname, "static")));

// ─── Admin-Tools: Backup / Restore / Init / Reset ──────────────────
const DB_NAME = "boxtracking.db";
const DB_DIR  = path.join(__dirname, "database");
const DB_PATH = path.join(DB_DIR, DB_NAME);

// Download DB  → /admin/backup  (Button “Datenbank herunterladen”)
app.get("/admin/backup", (req, res) => {
  res.download(DB_PATH, DB_NAME, (err) => {
    if (err) {
      console.error("[ERROR] DB-Download failed:", err);
      return res.status(500).json({ message: "Download fehlgeschlagen" });
    }
  });
});

// Restore DB  → /admin/restore  (File-Upload)
//  ▪ legt Uploads temporär in /tmp   ▪ überschreibt die alte DB
const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Keine Datei erhalten" });

  // Zielordner existiert evtl. nicht im Container → anlegen
  fs.mkdirSync(DB_DIR, { recursive: true });

  // Alte DB ersetzen
  fs.copyFile(req.file.path, DB_PATH, (err) => {
    fs.unlink(req.file.path, () => {});            // tmp-Datei aufräumen
    if (err) {
      console.error("[ERROR] DB-Restore failed:", err);
      return res.status(500).json({ message: "Restore fehlgeschlagen" });
    }
    return res.json({ message: "Datenbank wiederhergestellt" });
  });
});

// (Optional) Reset- / Init-Buttons – noch Platzhalter
app.post("/admin/reset-data",  (_req, res) => res.json({ message: "Reset ok" }));
app.post("/admin/init-data",   (_req, res) => res.json({ message: "Demo-Daten erzeugt" }));

// ─── SPA-Fallback ──────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "index.html"));
});

// ─── Serverstart ───────────────────────────────────────────────────
app.listen(PORT, () => console.log(`[INFO] Backend läuft auf Port ${PORT}`));
// ────────────────────────────────────────────────────────────────────
