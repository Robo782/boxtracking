// server/controllers/authController.js
const db      = require("../db");            // better-sqlite3-Instanz
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

/* ────────────────────────────────────────────────────────────
   POST /api/auth/login
   Body: { username | email , password }
   ──────────────────────────────────────────────────────────── */
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ───── Grundvalidierung
    if (!password || (!username && !email)) {
      return res
        .status(400)
        .json({ error: "username / email und Passwort erforderlich" });
    }

    // einheitliche Schreibweise → lowercase & trim
    const loginId = (username || email).trim().toLowerCase();

    // ───── User laden (synchron, ohne Callback!)
    const user = db
      .prepare(`SELECT * FROM users WHERE LOWER(username) = ?`)
      .get(loginId);

    if (!user) {
      return res.status(401).json({ error: "Ungültige Zugangsdaten" });
    }

    // ───── Passwort prüfen
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Ungültige Zugangsdaten" });
    }

    // ───── JWT generieren
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
  } catch (err) {
    console.error("❌ Unerwarteter Fehler:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};
