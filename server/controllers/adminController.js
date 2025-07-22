const db   = require("../db");
const fs   = require("fs");
const path = require("path");

/* ───────────────────────── Backup / Restore ────────────────────────── */
/*  (dein vorhandener Code blieb unverändert)                            */

exports.backup = (_, res) => {
  const file = path.join(__dirname, "..", "db", "database.sqlite");
  res.download(file, "database.sqlite");
};

exports.restore = (req, res) => {
  if (!req.file) return res.status(400).send("file missing");
  const dst = path.join(__dirname, "..", "db", "database.sqlite");
  fs.copyFileSync(req.file.path, dst);
  res.json({ ok: true, message: "Backup eingespielt" });
};

/* ──────────────────────   NEU: Reset & Init   ──────────────────────── */

/** Box-Daten zurücksetzen (Struktur bleibt) */
exports.resetData = async (_, res) => {
  try {
    await db.run("DELETE FROM box_history");   // Historie löschen

    await db.run(`
      UPDATE boxes
         SET cycles            = 0,
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

/** Demodaten erzeugen, falls Tabelle leer ist */
exports.initData = async (_, res) => {
  const { cnt } = await db.get("SELECT COUNT(*) AS cnt FROM boxes");
  if (cnt > 0) return res.json({ ok: false, message: "DB enthält bereits Boxen" });

  const stmt = db.prepare("INSERT INTO boxes (serial) VALUES (?)");
  for (let i = 1; i <= 30; i++) stmt.run(`BOX-${String(i).padStart(3, "0")}`);
  stmt.finalize();

  res.json({ ok: true, message: "30 Demo-Boxen angelegt" });
};
