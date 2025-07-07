// server/controllers/adminController.js
//-------------------------------------------------------------
//  Admin-Controller  –  device-box-tracker-fixed_v3
//-------------------------------------------------------------
const db     = require("../db");
const bcrypt = require("bcrypt");

/*──────────── Benutzerverwaltung ────────────*/
exports.getUsers = (_req, res) => {
  db.all(`SELECT id, username, role FROM users ORDER BY id`, (err, rows) =>
    err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
};

exports.createUser = async (req, res) => {
  const { username, password, role = "user" } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username & Passwort nötig" });
  if (!["user", "admin"].includes(role))
    return res.status(400).json({ error: "Ungültige Rolle" });

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.run(
      `INSERT INTO users (username, passwordHash, role) VALUES (?,?,?)`,
      [username.trim().toLowerCase(), hash, role]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.message.includes("UNIQUE"))
      return res.status(409).json({ error: "Username existiert bereits" });
    res.status(500).json({ error: err.message });
  }
};

/*──────────── DB-Reset (Werte leeren) ─────────*/
exports.resetDb = async (_req, res) => {
  try {
    await db.run(`
      UPDATE boxes SET
        cycles        = 0,
        device_serial = NULL,
        departed      = 0,
        returned      = 0,
        is_checked    = 0,
        checked_by    = NULL
    `);
    await db.run("DELETE FROM box_history");   // Historie leeren
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*──────────── Boxen-Seed (20 SSU + 40 Modul) ─*/
exports.seedBoxes = async (_req, res) => {
  try {
    const values = [];
    for (let i = 1; i <= 20; i++) {
      const n = String(i).padStart(2, "0");
      values.push(`('PU-S-${n}')`);
    }
    for (let i = 1; i <= 40; i++) {
      const n = String(i).padStart(2, "0");
      values.push(`('PU-M-${n}')`);
    }
    await db.run(`INSERT OR IGNORE INTO boxes (serial) VALUES ${values.join(",")}`);
    res.json({ success: true, inserted: values.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
/* PATCH /api/admin/boxes/:id
   Body darf beliebige Felder der Tabelle "boxes" enthalten */
exports.updateBox = (req, res) => {
  const id     = req.params.id;
  const fields = req.body;

  if (!Object.keys(fields).length)
    return res.status(400).json({ error: "Keine Felder übergeben" });

  const set  = Object.keys(fields).map(k => `${k}=?`).join(", ");
  const vals = Object.values(fields);

  db.run(`UPDATE boxes SET ${set} WHERE id=?`, [...vals, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success:true, changes:this.changes });
  });
};