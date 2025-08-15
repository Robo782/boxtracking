// server/controllers/authController.js
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secret";

exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if ((!username && !email) || !password) {
      return res.status(400).json({ error: "Anmeldedaten unvollständig" });
    }

    const user = username
      ? await db.get(`SELECT * FROM users WHERE username = ?`, [username])
      : await db.get(`SELECT * FROM users WHERE email = ?`, [email]);

    if (!user) return res.status(401).json({ error: "Ungültige Zugangsdaten" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Ungültige Zugangsdaten" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("login:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};
