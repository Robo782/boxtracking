/**
 * Controller-Logik für Login, Logout & Token-Handling
 */

const bcrypt = require('bcryptjs');           // ← vorher stand hier require('bcrypt')
const jwt    = require('jsonwebtoken');
const db     = require('../db');

/**
 * Hilfsfunktion: Passwort hashen
 */
async function hashPassword(plain) {
  const saltRounds = 10;
  return await bcrypt.hash(plain, saltRounds);
}

/**
 * Login-Endpunkt
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // User in DB suchen
    const user = db
      .prepare('SELECT id, password FROM users WHERE username = ?')
      .get(username);

    if (!user) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Passwort prüfen
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // JWT erzeugen
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Serverfehler' });
  }
};

/**
 * (weitere Controller-Funktionen ...)
 */
