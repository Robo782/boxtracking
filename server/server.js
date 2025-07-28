// server/server.js
// ============================================================================
//  Express-Backend  |  BoxTracking  |  Render-Docker
//  ▸ Admin-Backup  (WAL-Checkpoint + VACUUM INTO)  GET  /admin/backup
//  ▸ Restore       POST /admin/restore
//  ▸ NEU: Batch-Insert von Boxen        POST /api/boxes/batch
//  ▸ React-Build wird nach den Admin-Routen ausgeliefert
// ============================================================================
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const os      = require("os");
const multer  = require("multer");

const db                        = require("./db");  // Wrapper + raw-Instanz
const { DB_PATH, DB_FILE, DB_DIR } = db;

const app  = express();
const PORT = process.env.PORT || 5000;

/* ───────── Middleware ─────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ───────── 1) ADMIN – Backup / Restore ────────────────────────────────── */
// GET /admin/backup  – konsistente DB herunterladen
app.get("/admin/backup", (_req, res) => {
  try {
    db.raw.pragma("wal_checkpoint(TRUNCATE)");               // WAL flush
    const tmp = path.join(os.tmpdir(), `boxtracking-${Date.now()}.sqlite`);
    db.raw.exec(`VACUUM INTO '${tmp}'`);                     // Konsistente Kopie
    res.download(tmp, DB_FILE, err => { fs.unlink(tmp, () => {}); });
  } catch (err) {
    console.error("[admin/backup]", err);
    res.status(500).json({ message: "Backup fehlgeschlagen" });
  }
});

// POST /admin/restore  – hochgeladene DB ersetzt laufende
const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Keine Datei erhalten" });
  fs.mkdir(DB_DIR, { recursive: true }, () =>
    fs.copyFile(req.file.path, DB_PATH, err => {
      fs.unlink(req.file.path, () => {});
      if (err) {
        console.error("[admin/restore]", err);
        return res.status(500).json({ message: "Restore fehlgeschlagen" });
      }
      res.json({ message: "Datenbank wiederhergestellt" });
    })
  );
});

/* ───────── 2) NEU – Batch-Insert von Boxen ────────────────────────────── */
// Body: { "type": "PU-M", "count": 12 }
app.post("/api/boxes/batch", (req, res) => {
  const { type, count } = req.body;
  const valid = ["PU-M", "PU-S", "PR-SB", "PR-23"];
  if (!valid.includes(type))
    return res.status(400).json({ message: "Ungültiger Typ" });
  if (!Number.isInteger(count) || count < 1 || count > 200)
    return res.status(400).json({ message: "Anzahl 1–200 angeben" });

  const prefix = `${type}-`;
  const row    = db.raw.prepare(
    `SELECT serial
       FROM boxes
       WHERE serial LIKE ?
       ORDER BY serial DESC
       LIMIT 1`
  ).get(`${prefix}%`);
  let nextNum  = row ? parseInt(row.serial.slice(prefix.length), 10) + 1 : 1;

  const insert = db.raw.prepare(`INSERT INTO boxes (serial) VALUES (?)`);
  try {
    db.raw.exec("BEGIN");
    for (let i = 0; i < count; i++, nextNum++) {
      insert.run(`${prefix}${String(nextNum).padStart(2, "0")}`);
    }
    db.raw.exec("COMMIT");
    res.json({ message: `${count} Box(en) angelegt` });
  } catch (err) {
    db.raw.exec("ROLLBACK");
    console.error("[boxes/batch]", err);
    res.status(500).json({ message: "Insert fehlgeschlagen" });
  }
});

/* ───────── 3) React-Build ─────────────────────────────────────────────── */
const staticDir = path.join(__dirname, "static");  // per Dockerfile kopiert
app.use(express.static(staticDir));

/* SPA-Fallback */
app.get("*", (_req, res) => res.sendFile(path.join(staticDir, "index.html")));

/* ───────── Start ─────────────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`[BoxTracking] Server läuft auf Port ${PORT} | DB → ${DB_PATH}`)
);
