const bcrypt = require("bcrypt");
const db     = require("../db");

/* ─── USER-FUNKTIONEN ─────────────────────────── */

exports.getUsers = async (_, res) => {
  const rows = await db.all(
    "SELECT id, username, role FROM users ORDER BY id"
  );
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
    /* UNIQUE-Verletzung abfangen statt crashen */
    if (e.message.includes("UNIQUE"))
      return res.status(409).json({ error: "Username existiert bereits" });
    console.error("❌ createUser:", e);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

/* ─── BOX-TOOLS ───────────────────────────────── */

exports.resetData = async (_, res) => {
  try {
    await db.run("DELETE FROM box_history");
    await db.run(`
      UPDATE boxes SET
        cycles=0, maintenance_count=0, status='available',
        device_serial=NULL, pcc_id=NULL,
        departed=0, returned=0, is_checked=0,
        checked_by=NULL, loaded_at=NULL, unloaded_at=NULL
    `);
    res.json({ ok: true, message: "Box-Daten zurückgesetzt" });
  } catch (e) {
    console.error("❌ resetData:", e);
    res.status(500).json({ error: "DB-Fehler" });
  }
};

exports.initData = async (_, res) => {
  try {
    const { cnt } = await db.get("SELECT COUNT(*) AS cnt FROM boxes");
    if (cnt > 0)
      return res.json({ ok: false, message: "DB enthält bereits Boxen" });

    const stmt = db.prepare("INSERT INTO boxes (serial) VALUES (?)");
    for (let i = 1; i <= 30; i++)
      stmt.run(`BOX-${String(i).padStart(3, "0")}`);
    stmt.finalize();

    res.json({ ok: true, message: "30 Demo-Boxen angelegt" });
  } catch (e) {
    console.error("❌ initData:", e);
    res.status(500).json({ error: "DB-Fehler" });
  }
};

/* Aliase (alt) */
exports.seedBoxes = exports.initData;

/* Noch nicht implementiert */
exports.updateBox = (_req, res) =>
  res.status(501).json({ error: "updateBox nicht implementiert" });
