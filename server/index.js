// server/index.js ─ BoxTracking Backend (Render)
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs/promises");
const multer  = require("multer");

// ► EINZIGE Quelle der Wahrheit für Pfade kommt jetzt aus db.js
const { DB_PATH, DB_FILE, DB_DIR } = require("./db");   //  ← neu!

const app  = express();
const PORT = process.env.PORT || 10000;

/* ── Middleware ─────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ── Statisches React-Build ─────────────────────────────────── */
const STATIC_DIR = path.join(__dirname, "..", "dist", "assets");
app.use(express.static(STATIC_DIR));

/* ── ADMIN: Backup & Restore ────────────────────────────────── */
// 1) BACKUP
app.get("/admin/backup", async (_req, res) => {
  try {
    await fs.access(DB_PATH);                   // Existiert die Datei?
    return res.download(DB_PATH, DB_FILE);      // ✔ richtiger Pfad & Name
  } catch (err) {
    console.error("[backup] DB not found:", err);
    return res.status(404).json({ message: "Datenbank nicht gefunden" });
  }
});

// 2) RESTORE
const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Keine Datei erhalten" });

  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.copyFile(req.file.path, DB_PATH);
    await fs.unlink(req.file.path);             // tmp-Datei löschen
    return res.json({ message: "Datenbank wiederhergestellt" });
  } catch (err) {
    console.error("[restore] copy failed:", err);
    return res.status(500).json({ message: "Restore fehlgeschlagen" });
  }
});

/* ── SPA-Fallback ───────────────────────────────────────────── */
app.get("*", (_req, res) => res.sendFile(path.join(STATIC_DIR, "index.html")));

/* ── Start ──────────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`[BoxTracking] Backend läuft auf Port ${PORT} | DB → ${DB_PATH}`)
);
