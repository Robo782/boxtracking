// server/index.js
// ---------------------------------------------------------------------------
//  Express-Backend  |  Render-Deployment
//  ▸ holt DB_DIR / DB_FILE / DB_PATH aus server/db.js
//  ▸ /admin/backup   →    lädt EXACT dieselbe Datei herunter
//  ▸ /admin/restore  →    überschreibt sie mit Upload
// ---------------------------------------------------------------------------
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs/promises");
const multer  = require("multer");

const { DB_PATH, DB_FILE, DB_DIR } = require("./db");   // <── einheitlich!

const app  = express();
const PORT = process.env.PORT || 10000;

/* Middleware & statische Assets ------------------------------------------ */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "dist", "assets")));

/* ---------------------- ADMIN ROUTES ------------------------------------ */
// 1) BACKUP  – Datenbank herunterladen
app.get("/admin/backup", async (_req, res) => {
  try {
    await fs.access(DB_PATH);                     // Existiert die Datei?
    return res.download(DB_PATH, DB_FILE);       // ⇦ gleicher Name!
  } catch (err) {
    console.error("[backup] DB fehlt:", err);
    return res.status(404).json({ message: "Datenbank nicht gefunden" });
  }
});

// 2) RESTORE – Hochgeladene Datei ersetzt bestehende DB
const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Keine Datei erhalten" });

  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.copyFile(req.file.path, DB_PATH);
    await fs.unlink(req.file.path);              // tmp-Datei löschen
    return res.json({ message: "Datenbank wiederhergestellt" });
  } catch (err) {
    console.error("[restore] Fehler:", err);
    return res.status(500).json({ message: "Restore fehlgeschlagen" });
  }
});

/* SPA-Fallback ----------------------------------------------------------- */
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "..", "dist", "assets", "index.html"))
);

/* Start ------------------------------------------------------------------ */
app.listen(PORT, () =>
  console.log(`[BoxTracking] Port ${PORT} | DB → ${DB_PATH}`)
);
