const db      = require("../db");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

/**
 * POST /api/auth/login
 * erwartet: { username: "...", password: "..." }
 *     oder: { email:    "...", password: "..." }
 */
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    // Grund­validierung
    if (!password || (!username && !email)) {
      return res.status(400).json({ error: "username / email und Passwort erforderlich" });
    }

    // einheitliche Schreibweise → lowercase & trim
    const loginId = (username || email).trim().toLowerCase();

    // User holen
    const user = await db.get(
      `SELECT * FROM users WHERE LOWER(username) = ?`,
      [loginId]
    );

    if (!user) {
      return res.status(401).json({ error: "Ungültige Zugangsdaten" });
    }

    // Passwort abgleichen
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Ungültige Zugangsdaten" });
    }

    // JWT ausstellen
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("❌ Unerwarteter Fehler (login):", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};
