// server/routes/authRoutes.js
const router = require("express").Router();
const jwt    = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db     = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/* ───────── LOGIN ──────────────────────────────────────────────
   Body: { "identifier": "<username ODER e-mail>", "password": "…" }
---------------------------------------------------------------- */
router.post("/login", (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password)
    return res.status(400).json({ message: "Daten fehlen" });

  // ✔︎ sowohl e-mail als auch username zulassen
  const user = db.get(
    `SELECT * FROM users
       WHERE email = ? OR username = ?
       LIMIT 1`,
    [identifier, identifier]
  );
  if (!user) return res.status(401).json({ message: "User nicht gefunden" });

  if (!bcrypt.compareSync(password, user.passwordHash))
    return res.status(401).json({ message: "Passwort falsch" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
  res.json({ token, role: user.role });
});

/* ───────── weitere Auth-Endpunkte ───────────────────────────── */
// router.post("/register", …)
// router.get ("/whoami",  …)

module.exports = router;
