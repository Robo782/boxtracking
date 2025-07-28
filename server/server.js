// server/server.js
// ─────────────────────────────────────────────────────────────────────────────
//  Express-Backend für BoxTracking  –  Render-Deployment
//  ▸ Admin-Backup streamt jetzt eine konsistente DB (WAL-Checkpoint + VACUUM)
//  ▸ Restore ersetzt die DB per Upload
//  ▸ React-Build wird nach den Admin-Routen ausgeliefert
// ---------------------------------------------------------------------------

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const os      = require("os");
const multer  = require("multer");

const db                = require("./db");          // Wrapper + raw-Instanz
const { DB_PATH, DB_FILE, DB_DIR } = db;            // Konstanten aus db.js

const app  = express();
const PORT = process.env.PORT || 5000;

/* ─── Basis-Middleware ───────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ─── 1) ADMIN: Backup / Restore ─────────────────────────────────────────── */

// Backup  →  konsistente SQLite kopieren & herunterladen
app.get("/admin/backup", (_req, res) => {
  try {
    // 1) WAL-Datei flushen und leeren
    db.raw.pragma("wal_checkpoint(TRUNCATE)");

    // 2) Vollständiges Backup in eine tmp-Datei schreiben
    const tmpFile = path.join(os.tmpdir(), `boxtracking-${Date.now()}.sqlite`);
    db.raw.exec(`VACUUM INTO '${tmpFile}'`);

    // 3) Download streamen
    res.download(tmpFile, DB_FILE, (err) => {
      fs.unlink(tmpFile, () => {});               // tmp-Datei immer löschen
      if (err) console.error("[admin/backup] send error:", err);
    });
  } catch (err) {
    console.error("[admin/backup] failed:", err);
    res.status(500).json({ message: "Backup fehlgeschlagen" });
  }
});

// Restore  →  hochgeladene Datei ersetzt laufende DB
const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Keine Datei erhalten" });

  fs.mkdir(DB_DIR, { recursive: true }, () =>
    fs.copyFile(req.file.path, DB_PATH, (err) => {
      fs.unlink(req.file.path, () => {});         // tmp-Upload entsorgen
      if (err) {
        console.error("[admin/restore] copy:", err);
        return res.status(500).json({ message: "Restore fehlgeschlagen" });
      }
      res.json({ message: "Datenbank wiederhergestellt" });
    })
  );
});

/* ─── 2) React-Build (statische Assets) ──────────────────────────────────── */
const staticDir = path.join(__dirname, "static");   // COPY in Dockerfile
app.use(express.static(staticDir));

/* ─── 3) SPA-Fallback für React Router ───────────────────────────────────── */
app.get("*", (_req, res) =>
  res.sendFile(path.join(staticDir, "index.html"))
);

/* ─── 4) Serverstart ─────────────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`[BoxTracking] Backend läuft auf Port ${PORT} | DB → ${DB_PATH}`)
);
