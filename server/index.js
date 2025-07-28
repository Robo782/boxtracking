// server/index.js
// ---------------------------------------------------------------------------
//  Express-Backend für BoxTracking  |  Render-Deployment
//  Wichtig: Admin-Routen VOR express.static und VOR dem SPA-Fallback!
// ---------------------------------------------------------------------------
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");

const { DB_PATH, DB_FILE, DB_DIR } = require("./db");   // einzig gültige Quelle

const app  = express();
const PORT = process.env.PORT || 10000;

/* ────────────────────────────────────────────────────────────────────────────
   Globale Middleware
──────────────────────────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ────────────────────────────────────────────────────────────────────────────
   ADMIN-ROUTEN  (stehen ABSICHTLICH *vor* express.static!)
──────────────────────────────────────────────────────────────────────────── */

// BACKUP  →  DB als Download
app.get("/admin/backup", (req, res) => {
  fs.access(DB_PATH, fs.constants.R_OK, (err) => {
    if (err) {
      console.error("[admin/backup] DB nicht gefunden:", err);
      return res.status(404).json({ message: "Datenbank nicht gefunden" });
    }

    res.setHeader("Content-Disposition",
                  `attachment; filename="${DB_FILE}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    fs.createReadStream(DB_PATH).pipe(res);
  });
});

// RESTORE  →  Upload ersetzt bestehende DB
const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Keine Datei erhalten" });

  fs.mkdir(DB_DIR, { recursive: true }, (mkdirErr) => {
    if (mkdirErr) {
      console.error("[admin/restore] mkdir:", mkdirErr);
      return res.status(500).json({ message: "Restore fehlgeschlagen" });
    }

    fs.copyFile(req.file.path, DB_PATH, (copyErr) => {
      fs.unlink(req.file.path, () => {});      // tmp-Datei entsorgen
      if (copyErr) {
        console.error("[admin/restore] copy:", copyErr);
        return res.status(500).json({ message: "Restore fehlgeschlagen" });
      }
      res.json({ message: "Datenbank wiederhergestellt" });
    });
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   Statischer React-Build   (jetzt NACH den Admin-Routen)
──────────────────────────────────────────────────────────────────────────── */
const STATIC_DIR = path.join(__dirname, "..", "dist", "assets");
app.use(express.static(STATIC_DIR));

/* ────────────────────────────────────────────────────────────────────────────
   SPA-Fallback
──────────────────────────────────────────────────────────────────────────── */
app.get("*", (_req, res) =>
  res.sendFile(path.join(STATIC_DIR, "index.html"))
);

/* ────────────────────────────────────────────────────────────────────────────
   Server-Start
──────────────────────────────────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`[BoxTracking] Backend läuft auf Port ${PORT} | DB → ${DB_PATH}`)
);
