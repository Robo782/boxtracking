// server/controllers/authController.js
const db        = require("../db");
const bcrypt    = require("bcrypt");
const jwt       = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

/**
 * POST /api/auth/login
 * erwartet: { username: "...", password: "..." }
 * - oder alternativ: { email: "...", password: "..." }
 */
exports.login = (req, res) => {
  try {
    let { username, email, password } = req.body;

    // Grundvalidierung ─────────────────────────────────────────────
    if (!password || (!username && !email)) {
      return res.status(400).json({ error: "username / email und Passwort erforderlich" });
    }

    // einheitliche Schreibweise → lowercase & trim
    const loginId = (username || email).trim().toLowerCase();

    // User suchen (Case-insensitive)
    db.get(
      `SELECT * FROM users WHERE LOWER(username) = ?`,
      [loginId],
      async (err, user) => {
        if (err) {
          console.error("❌ DB-Fehler:", err.message);
          return res.status(500).json({ error: "Interner Serverfehler" });
        }

        if (!user) {
          return res.status(401).json({ error: "Ungültige Zugangsdaten" });
        }

        // Passwort prüfen
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
          return res.status(401).json({ error: "Ungültige Zugangsdaten" });
        }

        // JWT generieren
        const token = jwt.sign(
          {
            id:       user.id,
            username: user.username,
            role:     user.role,
          },
          JWT_SECRET,
          { expiresIn: "8h" }
        );

        return res.json({ token });
      }
    );
  } catch (e) {
    console.error("❌ Unerwarteter Fehler:", e);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};
