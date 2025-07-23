const bcrypt = require("bcrypt");
const db     = require("../db");

/* ---------- USER ---------- */
exports.getUsers = async (_, res) => {
  const rows = await db.all("SELECT id, username, role FROM users");
  res.json(rows);
};

exports.createUser = async (req, res) => {
  const { username, password, role = "user" } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username & password nötig" });

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.run(
      "INSERT INTO users (username, passwordHash, role) VALUES (?,?,?)",
      username.trim(), hash, role
    );
    res.json({ ok: true });
  } catch (e) {
    if (e.message.includes("UNIQUE"))
      return res.status(409).json({ error: "Username existiert bereits" });
    res.status(500).json({ error: e.message });
  }
};

/* ---------- BOX-TOOLS ---------- */
exports.resetData = async (_, res) => {
  await db.run("DELETE FROM box_history");
  await db.run("DELETE FROM boxes");
  res.json({ ok: true });
};

exports.initData = async (_, res) => {
  try {
    const { cnt } = await db.get("SELECT COUNT(*) AS cnt FROM boxes");
    if (cnt > 0) {
      if (res) return res.json({ ok: false, message: "DB enthält bereits Boxen" });
      return;
    }
    const stmt = db.prepare("INSERT INTO boxes (serial) VALUES (?)");
    for (let i = 1; i <= 30; i++)
      stmt.run(`BOX-${String(i).padStart(3, "0")}`);
    stmt.finalize();
    if (res) res.json({ ok: true, message: "30 Demo-Boxen angelegt" });
  } catch (e) {
    console.error("initData:", e.message);
    if (res) res.status(500).json({ error: e.message });
  }
};

exports.updateBox = (_, res) =>
  res.status(501).json({ error: "updateBox nicht implementiert" });
