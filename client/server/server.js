// server/server.js
const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");

// Middlewares
app.use(cors());
app.use(express.json());

// Routen
const authRoutes = require("./routes/authRoutes");
const boxRoutes = require("./routes/boxRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/boxes", boxRoutes);
app.use("/api/admin", adminRoutes);

// Backend starten
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`[INFO] Backend running on ${PORT}`);

  // ⏱ Admin-Seed beim Start (nur wenn nicht vorhanden)
  db.get("SELECT * FROM users WHERE username = 'admin'", async (err, row) => {
    if (err) return console.error("[DB] Fehler beim Prüfen des Admins:", err.message);
    if (!row) {
      const hash = await bcrypt.hash("admin123", 10);
      await db.run(
        "INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)",
        ["admin", hash, "admin"],
        (err) => {
          if (err) console.error("[DB] Fehler beim Admin-Seed:", err.message);
          else console.log("[INFO] Seeded admin user");
        }
      );
    }
  });
});
