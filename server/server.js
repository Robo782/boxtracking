// server/server.js  – Backend + React-Bundle
// ───────────────────────────────────────────────────────────────
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");
const bcrypt  = require("bcrypt");
const db      = require("./db");              // better-sqlite3 Wrapper

const { DB_PATH, DB_FILE } = db;              // kommt aus db.js
const app  = express();
const PORT = process.env.PORT || 5000;

/* ─── Basis-Middleware ───────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ─── 1) OFFENE ADMIN-ROUTE zum Download  ───────────────────── */
//  GET  /admin/backup  →  SQLite direkt streamen
app.get("/admin/backup", (req, res) => {
  fs.access(DB_PATH, fs.constants.R_OK, err => {
    if (err) {
      console.error("[backup] DB fehlt:", err);
      return res.status(404).json({ message: "Datenbank nicht gefunden" });
    }
    res.setHeader("Content-Type",      "application/octet-stream");
    res.setHeader("Content-Disposition",
                  `attachment; filename="${DB_FILE}"`);
    fs.createReadStream(DB_PATH).pipe(res);
  });
});

/* ─── 2) GESCHÜTZTE ADMIN-API (Stats, ZIP-Backup, Restore …) ─ */
app.use("/api/admin", require("./routes/adminRoutes"));

/* ─── 3) RESTLICHE API-ROUTEN ───────────────────────────────── */
app.use("/api/auth",  require("./routes/authRoutes"));
app.use("/api/boxes", require("./routes/boxRoutes"));

/* ─── 4) React-Build ausliefern ─────────────────────────────── */
const staticDir = path.join(__dirname, "static");  // via Docker COPY
app.use(express.static(staticDir));

/* SPA-Fallback für React Router */
app.get("*", (_req, res) =>
  res.sendFile(path.join(staticDir, "index.html"))
);

/* ─── 5) Serverstart + einmaliges Admin-Seeding ─────────────── */
app.listen(PORT, () => {
  console.log(`[INFO] Backend on :${PORT}  |  DB → ${DB_PATH}`);
  // default admin anlegen, falls nicht vorhanden
  const row = db.raw.prepare(
    "SELECT 1 FROM users WHERE username = 'admin'"
  ).get();
  if (!row) {
    const hash = bcrypt.hashSync("admin", 10);
    db.raw.prepare(
      "INSERT INTO users (username,passwordHash,role) VALUES ('admin',?, 'admin')"
    ).run(hash);
    console.warn("[INFO] Default-Admin (admin/admin) erzeugt");
  }
});
