// server/config/jwt.js
// Eine zentrale Stelle für das JWT-Secret, damit Login und Middleware
// garantiert dasselbe Secret verwenden.
const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // align mit deinem Bestand
const SIGN_OPTS = { expiresIn: "12h" };

module.exports = { JWT_SECRET, SIGN_OPTS };
