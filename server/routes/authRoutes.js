// server/routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET, SIGN_OPTS } = require("../config/jwt");

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { username|email, password }
 * Response: { token, role, username }
 */
router.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if ((!username && !email) || !password) {
      return res.status(400).json({ error: "Anmeldedaten unvollständig" });
    }

    const user = username
      ? db.raw.prepare(`SELECT * FROM users WHERE username = ?`).get(username)
      : db.raw.prepare(`SELECT * FROM users WHERE email = ?`).get(email);

    if (!user) return res.status(401).json({ error: "Ungültige Zugangsdaten" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Ungültige Zugangsdaten" });

    // Token mit id, username, role signieren – Secret zentral
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      SIGN_OPTS
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error("[auth/login]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

module.exports = router;
