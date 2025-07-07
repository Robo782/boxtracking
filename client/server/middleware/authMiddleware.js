// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secret";

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;           // enthält nun .role
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.sendStatus(403);
  next();
}

module.exports = { authenticate, requireAdmin };
