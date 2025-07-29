// server/routes/authRoutes.js
const router = require("express").Router();
const jwt    = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db     = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/* ---------- LOGIN ------------------------------------------------------- */
router.post("/login", (req, res) => {
  const { identifier, password } = req.body;    // ←  jetzt "identifier"

  // erst nach email, sonst nach username suchen
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

/* ---------- REGISTRIERUNG / WHOAMI etc. bleiben unverändert ------------ */
// … bestehender Code …

module.exports = router;
