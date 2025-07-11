// server/server.js
//------------------------------------------------------------------
// Express-Backend für BoxTracker – liefert API + React-SPA aus
//------------------------------------------------------------------
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const bcrypt  = require("bcrypt");
const db      = require("./db");          // ruft Migration automatisch auf

const app  = express();
const PORT = process.env.PORT || 5000;

/* ───────────── Middleware ───────────── */
app.use(cors());
app.use(express.json());

/* ───────────── API-Routen ───────────── */
app.use("/api/auth",  require("./routes/authRoutes"));
app.use("/api/boxes", require("./routes/boxRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

/* ───────── React-Build ausliefern ───── */
const staticDir = path.join(__dirname, "static");   // <── NEU: liegt neben server.js
app.use(express.static(staticDir));

/* SPA-Fallback für React-Router */
app.get("*", (_req, res) =>
  res.sendFile(path.join(staticDir, "index.html"))
);

/* ───────── Serverstart + Admin-Seed ─── */
app.listen(PORT, () => {
  console.log(`[INFO] Backend running on ${PORT}`);

  db.get(
    "SELECT 1 FROM users WHERE username = 'admin'",
    async (err, row) => {
      if (err) return console.error("[DB] Fehler:", err);
      if (!row) {
        const hash = await bcrypt.hash("admin123", 10);
        db.run(
          `INSERT INTO users (username, passwordHash, role)
           VALUES ('admin', ?, 'admin')`,
          [hash]
        );
        console.log(
          "[INFO] Seeded admin user (user: admin / pass: admin123)"
        );
      }
    }
  );
});
