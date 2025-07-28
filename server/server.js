// server/server.js
// ────────────────────────────────────────────────────────────────
//  Express-Backend + React-Bundle  (Render-Deployment)
//  ▸ Admin-Backup  GET  /admin/backup    →  data.sqlite download
//  ▸ Restore       POST /admin/restore   →  DB ersetzen
//  ▸ Alle anderen Routen unverändert
// ----------------------------------------------------------------
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");

const { DB_PATH, DB_FILE, DB_DIR } = require("./db");  // zentrale Konstanten

const app  = express();
const PORT = process.env.PORT || 5000;

/* ───────── Basis-Middleware ─────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ───────── 1) ADMIN-ROUTEN │ MÜSSEN VOR static+SPA stehen ───── */
// 1a) Backup: DB herunterladen
app.get("/admin/backup", (_req, res) => {
  fs.access(DB_PATH, fs.constants.R_OK, err => {
    if (err) {
      console.error("[admin/backup] DB fehlt:", err);
      return res.status(404).json({ message: "Datenbank nicht gefunden" });
    }
    res.setHeader("Content-Type",      "application/octet-stream");
    res.setHeader("Content-Disposition",
                  `attachment; filename="${DB_FILE}"`);
    fs.createReadStream(DB_PATH).pipe(res);
  });
});

// 1b) Restore: DB ersetzen
const upload = multer({ dest: "/tmp" });
app.post("/admin/restore", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Keine Datei erhalten" });

  fs.mkdir(DB_DIR, { recursive: true }, () =>
    fs.copyFile(req.file.path, DB_PATH, err => {
      fs.unlink(req.file.path, () => {});
      if (err) {
        console.error("[admin/restore] copy:", err);
        return res.status(500).json({ message: "Restore fehlgeschlagen" });
      }
      res.json({ message: "Datenbank wiederhergestellt" });
    })
  );
});
/* ─────────────────────────────────────────────────────────────── */

/* ───────── 2) Bisherige API-Routen  (Beispiel) ───────────────── */
app.use("/api/boxes",  require("./routes/boxRoutes"));
app.use("/api/users",  require("./routes/userRoutes"));
app.use("/api/auth",   require("./routes/authRoutes"));
/* ─────────────────────────────────────────────────────────────── */

/* ───────── 3) React-Build ausliefern  (jetzt NACH Admin-Routes) */
const staticDir = path.join(__dirname, "static");   // Build-Output (dist)
app.use(express.static(staticDir));

/* ───────── 4) SPA-Fallback  (ganz zuletzt) ───────────────────── */
app.get("*", (_req, res) =>
  res.sendFile(path.join(staticDir, "index.html"))
);

/* ───────── 5) Start-Log  ─────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`[BoxTracking] Backend läuft auf Port ${PORT} | DB → ${DB_PATH}`)
);
