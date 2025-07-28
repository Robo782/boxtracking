// server/index.js
// ---------------------------------------------------------------------------
//  Express-Backend  |  Admin-Tools immer VOR statischer Middleware registrieren
// ---------------------------------------------------------------------------
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");

const { DB_PATH, DB_FILE, DB_DIR } = require("./db");   // zentrale Konstanten

const app  = express();
const PORT = process.env.PORT || 10000;

/* ── Globale Middleware ─────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ── ADMIN-ROUTEN  (stehen ABSICHTLICH VOR express.static!) ─────────────── */
// 1) BACKUP  –  DB als Stream zum Download
app.get("/admin/backup", (req, res) => {
  fs.access(DB_PATH, fs.constants.R_OK, (err) => {
    if (err) {
      console.error("[backup] DB fehlt:", err);
      return res.status(404).json({ message: "Datenbank nicht gefunden" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${DB_FILE}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    fs.createReadStream(DB_PATH).pipe(res);
  });
});

// 2) RESTORE –  Upload ersetzt bestehende DB
const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Keine Datei erhalten" });

  fs.mkdir(DB_DIR, { recursive: true }, (dirErr) => {
    if (dirErr) {
      console.error("[restore] mkdir:", dirErr);
      return res.status(500).json({ message: "Restore fehlgeschlagen" });
    }

    fs.copyFile(req.file.path, DB_PATH, (copyErr) => {
      fs.unlink(req.file.path, () => {});
      if (copyErr) {
        console.error("[restore] copy:", copyErr);
        return res.status(500).json({ message: "Restore fehlgeschlagen" });
      }
      res.json({ message: "Datenbank wiederhergestellt" });
    });
  });
});

/* ── Statische Dateien des React-Builds  (jetzt NACH den Admin-Routen) ──── */
const STATIC_DIR = path.join(__dirname, "..", "dist", "assets");
app.use(express.static(STATIC_DIR));

/* ── SPA-Fallback ───────────────────────────────────────────────────────── */
app.get("*", (_req, res) =>
  res.sendFile(path.join(STATIC_DIR, "index.html"))
);

/* ── Start ─────────────────────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`[BoxTracking] Server läuft auf Port ${PORT} | DB → ${DB_PATH}`)
);
