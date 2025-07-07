// server/controllers/authController.js
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Login-Funktion
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Deine Datenbank hat das Feld "username", nicht "email"
  db.get(`SELECT * FROM users WHERE username = ?`, [email], async (err, user) => {
    if (err) {
      console.error("❌ DB-Fehler:", err.message);
      return res.status(500).json({ error: "Interner Serverfehler" });
    }

    if (!user) {
      console.log("❌ Benutzer nicht gefunden");
      return res.status(401).json({ error: "Ungültige Zugangsdaten" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      console.log("❌ Passwort falsch");
      return res.status(401).json({ error: "Ungültige Zugangsdaten" });
    }

    // JWT generieren mit username & role
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  });
};
