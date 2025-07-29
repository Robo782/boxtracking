// server/server.js ---------------------------------------------------------
const express = require("express");
const cors    = require("cors");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const os      = require("os");

const db                = require("./db");      // enthält ensureAdmin()
const { DB_PATH, DB_DIR } = db;

const app  = express();
const PORT = process.env.PORT || 10_000;

/* ─────────────── Global Middleware ──────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ─────────────── ADMIN – Backup & Restore ──────────────────────────── */
app.get("/admin/backup", (_req, res) => {
  try {
    db.raw.pragma("wal_checkpoint(TRUNCATE)");
    const tmp = path.join(os.tmpdir(), `boxtracking-${Date.now()}.sqlite`);
    db.raw.exec(`VACUUM INTO '${tmp}'`);
    res.download(tmp, "data.sqlite", () => fs.unlink(tmp, () => {}));
  } catch (e) {
    console.error("[admin/backup]", e);
    res.status(500).json({ message: "Backup fehlgeschlagen" });
  }
});

const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Keine Datei" });

  fs.mkdir(DB_DIR, { recursive: true }, () => {
    fs.copyFile(req.file.path, DB_PATH, (err) => {
      fs.unlink(req.file.path, () => {});
      if (err) return res.status(500).json({ message: "Restore fehlgeschlagen" });
      db.ensureAdmin();                              // Hash sofort reparieren
      res.json({ message: "Datenbank wiederhergestellt" });
    });
  });
});

/* ─────────────── BATCH-INSERT Boxen ─────────────────────────────────── */
app.post("/api/boxes/batch", (req, res) => {
  const { type, count } = req.body;
  const valid = ["PU-M", "PU-S", "PR-SB", "PR-23"];
  if (!valid.includes(type))
    return res.status(400).json({ message: "Ungültiger Typ" });
  if (!Number.isInteger(count) || count < 1 || count > 200)
    return res.status(400).json({ message: "Anzahl 1–200 angeben" });

  const prefix = `${type}-`;
  const last = db.raw.prepare(`
      SELECT serial FROM boxes
       WHERE serial LIKE ?
       ORDER BY serial DESC LIMIT 1
  `).get(`${prefix}%`);
  let next = last ? parseInt(last.serial.slice(prefix.length), 10) + 1 : 1;

  const insert = db.raw.prepare(`INSERT INTO boxes (serial) VALUES (?)`);
  try {
    db.raw.exec("BEGIN");
    for (let i = 0; i < count; i++, next++)
      insert.run(`${prefix}${String(next).padStart(2, "0")}`);
    db.raw.exec("COMMIT");
    res.json({ message: `${count} Box(en) angelegt` });
  } catch (e) {
    db.raw.exec("ROLLBACK");
    console.error("[boxes/batch]", e);
    res.status(500).json({ message: "Insert fehlgeschlagen" });
  }
});

/* ─────────────── API-Routen ─────────────────────────────────────────── */
app.use("/api/auth",  require("./routes/authRoutes"));
app.use("/api/boxes", require("./routes/boxRoutes"));   // Box-Liste

/* ─────────────── React-Frontend ─────────────────────────────────────── */
const staticDir = path.join(__dirname, "static");
app.use(express.static(staticDir));
app.get("*", (_req, res) =>
  res.sendFile(path.join(staticDir, "index.html"))
);

/* ─────────────── Starten ────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`[BoxTracking] läuft auf Port ${PORT} | DB → ${DB_PATH}`)
);
