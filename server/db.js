// server/db.js
// ─────────────────────────────────────────────────────────────
// SQLite-Initialisierung + Migration  (passt sich selbst an)
// DB-Datei liegt im gemounteten Render-Disk-Ordner  /app/server/db/
// ─────────────────────────────────────────────────────────────
const sqlite3 = require("sqlite3").verbose();
const path    = require("path");
const fs      = require("fs");

// 1) Ordner anlegen, falls er fehlt (wichtig für Render-Disk)
const dbDir  = path.join(__dirname, "db");
const dbFile = path.join(dbDir, "database.sqlite");
fs.mkdirSync(dbDir, { recursive: true });

// 2) DB öffnen / erstellen
const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

/* ════════════════ Migration ════════════════════════ */
db.serialize(() => {
  // Performance
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA busy_timeout = 5000");

  /* ---------- USERS ---------- */
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT UNIQUE,
      passwordHash TEXT,
      role         TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user',
      email        TEXT
    )
  `);

  /*  Spalten nachträglich ergänzen, falls alter Stand  */
  db.all(`PRAGMA table_info(users)`, (err, cols) => {
    if (err) return console.error(err);
    const have = n => cols.some(c => c.name === n);

    if (!have("username"))
      db.run(`ALTER TABLE users ADD COLUMN username TEXT`);
    if (!have("passwordHash"))
      db.run(`ALTER TABLE users ADD COLUMN passwordHash TEXT`);
    if (!have("role"))
      db.run(`ALTER TABLE users ADD COLUMN role TEXT
              CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'`);
    if (!have("email"))
      db.run(`ALTER TABLE users ADD COLUMN email TEXT`);
  });

  /* ---------- BOXES ---------- */
  db.run(`
    CREATE TABLE IF NOT EXISTS boxes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      serial        TEXT UNIQUE,
      pcc_id        TEXT,
      cycles        INTEGER DEFAULT 0,
      device_serial TEXT,
      departed      INTEGER DEFAULT 0,
      returned      INTEGER DEFAULT 0,
      is_checked    INTEGER DEFAULT 0,
      checked_by    TEXT
    )
  `);

  db.all(`PRAGMA table_info(boxes)`, (err, cols) => {
    if (err) return console.error(err);
    const have = n => cols.some(c => c.name === n);

    if (!have("pcc_id"))
      db.run(`ALTER TABLE boxes ADD COLUMN pcc_id TEXT`);
  });

  /* ---------- BOX_HISTORY ---------- */
  db.run(`
    CREATE TABLE IF NOT EXISTS box_history (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      box_id        INTEGER,
      device_serial TEXT,
      loaded_at     TEXT,
      unloaded_at   TEXT,
      checked_by    TEXT,
      pcc_id        TEXT
    )
  `);

  db.all(`PRAGMA table_info(box_history)`, (err, cols) => {
    if (err) return console.error(err);
    const have = n => cols.some(c => c.name === n);

    if (!have("pcc_id"))
      db.run(`ALTER TABLE box_history ADD COLUMN pcc_id TEXT`);
  });
});

module.exports = db;
