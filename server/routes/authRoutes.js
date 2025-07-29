// server/routes/authRoutes.js
const router  = require("express").Router();
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const db      = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/* ───────── LOGIN ─────────────────────────────────────────────
   Body darf entweder
     { "identifier": "admin",  "password": "admin" }
   oder
     { "username":   "admin",  "password": "admin" }
   senden.
---------------------------------------------------------------- */
router.post("/login", (req, res) => {
  const identifier = req.body.identifier ?? req.body.username;
  const { password } = req.body;

  if (!identifier || !password)
    return res.status(400).json({ message: "Daten fehlen" });

  const user = db.get(
    `SELECT * FROM users
       WHERE email = ? OR username = ?
       LIMIT 1`,
    [identifier, identifier]
  );

  if (!user || !user.passwordHash)
    return res.status(401).json({ message: "User nicht gefunden" });

  if (!bcrypt.compareSync(password, user.passwordHash))
    return res.status(401).json({ message: "Passwort falsch" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, role: user.role });
});

/*  ───── andere Auth-Endpunkte (Register, WhoAmI …) bleiben wie gehabt ──── */
module.exports = router;
