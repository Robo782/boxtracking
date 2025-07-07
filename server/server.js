// server/server.js
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const db      = require("./db");
const bcrypt  = require("bcrypt");

const app  = express();
const PORT = process.env.PORT || 5000;

/* ─── Middleware ─────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ─── API-Routen ─────────────────────────────────────────── */
app.use("/api/auth",  require("./routes/authRoutes"));
app.use("/api/boxes", require("./routes/boxRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

/* ─── React-Static ausliefern ────────────────────────────── */
const staticDir = path.join(__dirname, "static");     // hierhin kopiert Docker das build
app.use(express.static(staticDir));

/* SPA-Fallback */
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

/* ─── Serverstart + Admin-Seed ───────────────────────────── */
app.listen(PORT, () => {
  console.log(`[INFO] Backend running on ${PORT}`);

  db.get("SELECT * FROM users WHERE username = 'admin'", async (err, row) => {
    if (err) return console.error("[DB] Fehler:", err);
    if (!row) {
      const hash = await bcrypt.hash("admin123", 10);
      db.run(
        "INSERT INTO users (username, passwordHash, role) VALUES (?,?,?)",
        ["admin", hash, "admin"]
      );
      console.log("[INFO] Seeded admin user");
    }
  });
});
