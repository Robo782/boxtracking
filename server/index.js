// server/index.js
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ─────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ── React-Build als statische Dateien ──────────────────────── */
app.use(express.static(path.join(__dirname, "static")));

/* ── Datenbank-Konstanten ───────────────────────────────────── */
const DB_NAME = "boxtracking.db";
const DB_DIR  = path.join(__dirname, "database");
const DB_PATH = path.join(DB_DIR, DB_NAME);

/* ── Backup: Download der SQLite-DB ─────────────────────────── */
app.get("/admin/backup", (req, res) => {
  res.download(DB_PATH, DB_NAME, (err) => {
    if (err) {
      console.error("DB-Download error:", err);
      if (!res.headersSent)
        res.status(500).json({ message: "Download fehlgeschlagen" });
    }
  });
});

/* ── Restore: Upload & Ersetzen der DB ──────────────────────── */
const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Keine Datei erhalten" });

  fs.mkdir(DB_DIR, { recursive: true }, (dirErr) => {
    if (dirErr) {
      console.error("Dir creation error:", dirErr);
      return res.status(500).json({ message: "Restore fehlgeschlagen" });
    }

    fs.copyFile(req.file.path, DB_PATH, (err) => {
      fs.unlink(req.file.path, () => {}); // tmp-Datei entsorgen
      if (err) {
        console.error("DB-Restore error:", err);
        return res.status(500).json({ message: "Restore fehlgeschlagen" });
      }
      res.json({ message: "Datenbank wiederhergestellt" });
    });
  });
});

/* ── SPA-Fallback ───────────────────────────────────────────── */
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "static/index.html"))
);

/* ── Start ──────────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`Server listening on port ${PORT}`)
);
