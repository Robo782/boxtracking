// server/controllers/authController.js
const db      = require("../db");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

/**
 * POST /api/auth/login
 * { username: "...", password: "..." }  oder  { email: "...", password: "..." }
 */
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body ?? {};

    if (!password || (!username && !email)) {
      return res
        .status(400)
        .json({ error: "username / email und Passwort erforderlich" });
    }

    const loginId = (username || email).trim().toLowerCase();

    // ► EINZIGER DB-Zugriff – jetzt über Promise-Wrapper
    const user = await db.get(
      `SELECT * FROM users
         WHERE LOWER(username) = ?
            OR LOWER(email)    = ?`,
      loginId,
      loginId
    );

if (!user || !user.passwordHash) {
  return res.status(401).json({ error: "Ungültige Zugangsdaten" });
}

// Passwort prüfen
const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      return res.status(401).json({ error: "Ungültige Zugangsdaten" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ token });
  } catch (err) {
    console.error("❌ Unerwarteter Fehler:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};
