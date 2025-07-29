const router  = require("express").Router();
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const db      = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/* ----------  POST /api/auth/login  --------------------------- */
router.post("/login", (req, res) => {
  try {
    // 1) aus Body lesen: identifier ODER username ODER email
    const id  = req.body.identifier ?? req.body.username ?? req.body.email;
    const { password } = req.body;

    if (!id || !password)
      return res.status(400).json({ message: "Daten fehlen" });

    // 2) passenden User holen
    const user = db.get(
      "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1",
      [id, id]
    );
    if (!user)       return res.status(401).json({ message: "User fehlt" });
    if (!bcrypt.compareSync(password, user.passwordHash))
                     return res.status(401).json({ message: "Passwort falsch" });

    // 3) Token ausstellen
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "12h" }
    );
    res.json({ token, role: user.role });
  } catch (err) {
    console.error("[auth/login]", err);
    res.status(500).json({ message: "Serverfehler" });
  }
});

module.exports = router;
