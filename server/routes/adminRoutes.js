const bcrypt = require("bcryptjs");
const db     = require("../db");

/* ─────────────────────────  USERS  ───────────────────────── */

/** Liste aller User (id, username, role) */
exports.getUsers = async (_, res) => {
  const rows = await db.all("SELECT id, username, role FROM users ORDER BY id");
  res.json(rows);
};

/** Neuen User anlegen  { username, password, role } */
exports.createUser = async (req, res) => {
  const { username, password, role = "user" } = req.body;
  if (!username || !password) return res.status(400).send("username & password nötig");

  const hash = await bcrypt.hash(password, 10);
  try {
    await db.run(
      "INSERT INTO users (username, passwordHash, role) VALUES (?,?,?)",
      username, hash, role
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(400).send(e.message);
  }
};

/* ─────────────────────────  BOX-TOOLS  ───────────────────── */

exports.resetData = async (_, res) => {
  try {
    await db.run("DELETE FROM box_history");
    await db.run(`
      UPDATE boxes SET
        cycles            = 0,
        maintenance_count = 0,
        status            = 'available',
        device_serial     = NULL,
        pcc_id            = NULL,
        departed          = 0,
        returned          = 0,
        is_checked        = 0,
        checked_by        = NULL,
        loaded_at         = NULL,
        unloaded_at       = NULL
    `);
    res.json({ ok: true, message: "Box-Daten zurückgesetzt" });
  } catch (e) {
    res.status(500).send(e.message);
  }
};

/** Demo-Boxen (30 Stück) anlegen, falls Tabelle leer ist */
exports.initData = async (_, res) => {
  const { cnt } = await db.get("SELECT COUNT(*) AS cnt FROM boxes");
  if (cnt > 0) return res.json({ ok: false, message: "DB enthält bereits Boxen" });

  const stmt = db.prepare("INSERT INTO boxes (serial) VALUES (?)");
  for (let i = 1; i <= 30; i++) stmt.run(`BOX-${String(i).padStart(3, "0")}`);
  stmt.finalize();

  res.json({ ok: true, message: "30 Demo-Boxen angelegt" });
};

/* ─────────────  Alte Endpunkte (Aliase)  ──────────────── */

/** seed-Boxes – Alias auf initData (Bestandscode) */
exports.seedBoxes = exports.initData;

/** updateBox – hier nur Platzhalter; passe bei Bedarf an */
exports.updateBox = (req, res) => {
  res.status(501).send("updateBox nicht implementiert");
};
