// server/controllers/adminController.js
const bcrypt = require("bcrypt");
const db = require("../db");

/* ───────────── Stats (additiv) ───────────── */
exports.getStats = (req, res) => {
  try {
    const boxesTotal   = db.raw.prepare(`SELECT COUNT(*) AS n FROM boxes`).get()?.n ?? 0;
    const historyTotal = db.raw.prepare(`SELECT COUNT(*) AS n FROM box_history`).get()?.n ?? 0;
    const usersTotal   = db.raw.prepare(`SELECT COUNT(*) AS n FROM users`).get()?.n ?? 0;
    res.json({ boxes: boxesTotal, history: historyTotal, users: usersTotal });
  } catch (err) {
    console.error("getStats:", err);
    res.status(500).json({ error: "Stats Error" });
  }
};

/* ───────────── User-Management (additiv) ───────────── */

/** GET /api/admin/users – ohne passwordHash */
exports.listUsers = (_req, res) => {
  try {
    const rows = db.raw
      .prepare(`SELECT id, username, email, role FROM users ORDER BY username ASC`)
      .all();
    res.json(rows);
  } catch (err) {
    console.error("listUsers:", err);
    res.status(500).json({ error: "Konnte Users nicht laden" });
  }
};

/** POST /api/admin/users – User anlegen */
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "username und password sind Pflicht" });
    }
    const roleSafe = role === "admin" ? "admin" : "user";
    const hash = await bcrypt.hash(password, 10);

    const stmt = db.raw.prepare(
      `INSERT INTO users (username, email, passwordHash, role) VALUES (?, ?, ?, ?)`
    );
    stmt.run(username.trim(), (email || null)?.trim?.() || null, hash, roleSafe);

    const user = db.raw
      .prepare(`SELECT id, username, email, role FROM users WHERE username = ?`)
      .get(username.trim());

    res.status(201).json(user);
  } catch (err) {
    const msg = String(err && err.message || "");
    if (msg.includes("UNIQUE") || msg.includes("constraint")) {
      return res.status(409).json({ error: "Username oder E-Mail bereits vergeben" });
    }
    console.error("createUser:", err);
    res.status(500).json({ error: "Konnte User nicht anlegen" });
  }
};

/** PATCH /api/admin/users/:id – Rolle/Name/E-Mail ändern */
exports.updateUser = (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, email, role } = req.body || {};
    if (!id) return res.status(400).json({ error: "Ungültige ID" });

    const before = db.raw.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
    if (!before) return res.status(404).json({ error: "User nicht gefunden" });

    const roleSafe = role === "admin" ? "admin" : role === "user" ? "user" : before.role;

    db.raw
      .prepare(`UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?`)
      .run(
        (username ?? before.username)?.trim(),
        (email ?? before.email)?.trim() || null,
        roleSafe,
        id
      );

    const after = db.raw
      .prepare(`SELECT id, username, email, role FROM users WHERE id = ?`)
      .get(id);
    res.json(after);
  } catch (err) {
    const msg = String(err && err.message || "");
    if (msg.includes("UNIQUE") || msg.includes("constraint")) {
      return res.status(409).json({ error: "Username oder E-Mail bereits vergeben" });
    }
    console.error("updateUser:", err);
    res.status(500).json({ error: "Konnte User nicht aktualisieren" });
  }
};

/** PATCH /api/admin/users/:id/password – Passwort setzen */
exports.resetPassword = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { password } = req.body || {};
    if (!id || !password) return res.status(400).json({ error: "ID und neues Passwort benötigt" });

    const hash = await bcrypt.hash(password, 10);
    const info = db.raw.prepare(`UPDATE users SET passwordHash = ? WHERE id = ?`).run(hash, id);
    if (info.changes === 0) return res.status(404).json({ error: "User nicht gefunden" });

    res.status(204).end();
  } catch (err) {
    console.error("resetPassword:", err);
    res.status(500).json({ error: "Konnte Passwort nicht setzen" });
  }
};

/** DELETE /api/admin/users/:id – User löschen (Default-Admin schützen) */
exports.deleteUser = (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ungültige ID" });

    const user = db.raw.prepare(`SELECT id, username FROM users WHERE id = ?`).get(id);
    if (!user) return res.status(404).json({ error: "User nicht gefunden" });

    if (user.username === "admin") {
      return res.status(403).json({ error: "Der Default-Admin kann nicht gelöscht werden" });
    }

    db.raw.prepare(`DELETE FROM users WHERE id = ?`).run(id);
    res.status(204).end();
  } catch (err) {
    console.error("deleteUser:", err);
    res.status(500).json({ error: "Konnte User nicht löschen" });
  }
};
