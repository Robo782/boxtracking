/**
 * Ganz einfache Auth-Helpers.
 * requireAuth   – prüft, ob ein User-Objekt existiert (z. B. via JWT).
 * requireAdmin  – prüft zusätzlich die isAdmin-Flagge.
 * Passe das nach Bedarf an dein tatsächliches Auth-System an.
 */
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Nicht eingeloggt.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin-Rechte nötig.' });
  next();
}

module.exports = { requireAuth, requireAdmin };
