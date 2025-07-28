// server/server.js
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");

const { DB_PATH, DB_FILE, DB_DIR } = require("./db");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* ─── 1) ADMIN: Backup / Restore ─────────────────────────── */
app.get("/admin/backup", (_req, res) => {
  fs.access(DB_PATH, fs.constants.R_OK, err => {
    if (err) return res.status(404).json({ message: "Datenbank nicht gefunden" });

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${DB_FILE}"`);
    fs.createReadStream(DB_PATH).pipe(res);
  });
});

const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Keine Datei erhalten" });

  fs.mkdir(DB_DIR, { recursive: true }, () =>
    fs.copyFile(req.file.path, DB_PATH, err => {
      fs.unlink(req.file.path, () => {});
      if (err) return res.status(500).json({ message: "Restore fehlgeschlagen" });
      res.json({ message: "Datenbank wiederhergestellt" });
    })
  );
});
/* ──────────────────────────────────────────────────────────── */

/* ─── 2) React-Build ───────────────────────────────────────── */
const staticDir = path.join(__dirname, "static");
app.use(express.static(staticDir));

/* ─── 3) SPA-Fallback ─────────────────────────────────────── */
app.get("*", (_req, res) =>
  res.sendFile(path.join(staticDir, "index.html"))
);

app.listen(PORT, () =>
  console.log(`[BoxTracking] Backend läuft auf Port ${PORT} | DB → ${DB_PATH}`)
);
