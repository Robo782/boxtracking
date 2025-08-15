// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");
const db = require("../db");

/**
 * Liest Token aus:
 * - Authorization: Bearer <token>
 * - X-Auth-Token (Fallback)
 * - Cookie "token" (falls gesetzt)
 * und setzt req.user = { id, username, role, isAdmin }.
 * Kein Hard-Fail: bei Fehler bleibt req.user = null.
 */
function attachUser(req, _res, next) {
  const hdr = req.headers?.authorization || req.headers?.Authorization || "";
  const bearer = hdr.toLowerCase().startsWith("bearer ") ? hdr.slice(7) : null;
  const headerToken = req.headers["x-auth-token"] || req.headers["X-Auth-Token"];
  const cookieToken = (() => {
    const c = req.headers.cookie || "";
    const m = c.match(/(?:^|;\s*)token=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  })();

  const token = bearer || headerToken || cookieToken;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    let { id, username, role, isAdmin } = payload || {};

    // Fallback: Rolle aus DB nachladen, falls nicht im Token
    if (!role && (id || username)) {
      try {
        const row = id
          ? db.raw.prepare(`SELECT role FROM users WHERE id = ?`).get(id)
          : db.raw.prepare(`SELECT role FROM users WHERE username = ?`).get(username);
        role = row?.role || null;
      } catch {}
    }

    req.user = {
      id: id ?? null,
      username: username ?? null,
      role: role ?? null,
      isAdmin: isAdmin === true || role === "admin",
    };
  } catch {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Nicht eingeloggt." });
  next();
}

function requireAdmin(req, res, next) {
  const ok = req.user?.isAdmin || req.user?.role === "admin";
  if (!ok) return res.status(403).json({ error: "Admin-Rechte nötig." });
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin };
