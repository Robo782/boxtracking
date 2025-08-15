// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const db = require("../db"); // für Fallback-Role-Lookup

const JWT_SECRET = process.env.JWT_SECRET || "secret";

/**
 * attachUser:
 * - Liest JWT aus Authorization: Bearer <token>
 * - Setzt req.user = { id, username, role, isAdmin } oder null.
 * - Wenn role nicht im Token ist, wird sie aus der DB nachgeladen.
 * - Hat KEIN Hard-Fail: Ohne/ungültiges Token bleibt req.user = null.
 */
function attachUser(req, _res, next) {
  const hdr = req.headers?.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    let { id, username, role, isAdmin } = payload || {};

    // Fallback: falls role fehlt, aus DB nachladen
    try {
      if (!role && id) {
        const row = db.raw.prepare(`SELECT role FROM users WHERE id = ?`).get(id);
        role = row?.role || null;
      } else if (!role && username) {
        const row = db.raw.prepare(`SELECT role FROM users WHERE username = ?`).get(username);
        role = row?.role || null;
      }
    } catch (_) {}

    req.user = {
      id: id ?? null,
      username: username ?? null,
      role: role ?? null,
      isAdmin: isAdmin === true || role === "admin",
    };
  } catch (_e) {
    req.user = null; // abgelaufen/ungültig → einfach als nicht eingeloggt behandeln
  }
  next();
}

/** requireAuth – nur eingeloggte Nutzer */
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Nicht eingeloggt." });
  next();
}

/** requireAdmin – akzeptiert role==="admin" oder isAdmin===true */
function requireAdmin(req, res, next) {
  const isAdmin = req.user?.isAdmin || req.user?.role === "admin";
  if (!isAdmin) return res.status(403).json({ error: "Admin-Rechte nötig." });
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin };
