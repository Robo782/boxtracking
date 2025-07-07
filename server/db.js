// server/db.js
// ────────────────────────────────────────────────────────────
// SQLite-Init + Migration (läuft einmalig beim Start)
// DB‐Datei liegt im gemounteten Ordner  /app/server/db/
// ────────────────────────────────────────────────────────────
const sqlite3 = require("sqlite3").verbose();
const path    = require("path");

// Datenbank-Datei im Disk-Mount-Pfad
const dbFile = path.join(__dirname, "db", "database.sqlite");
const db     = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

// ─── Migration ──────────────────────────────────────────────
db.serialize(() => {
  /* Performance + Locks */
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA busy_timeout = 5000");

  /* USERS  ─ mit username + passwordHash + role */
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT UNIQUE,
      passwordHash TEXT,
      role         TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'
    )
  `);

  /* falls Spalten nachträglich fehlen → nachziehen */
  db.all(`PRAGMA table_info(users)`, (err, cols) => {
    if (err) return console.error(err);
    const have = name => cols.some(c => c.name === name);

    if (!have("username"))
      db.run(`ALTER TABLE users ADD COLUMN username TEXT`);
    if (!have("passwordHash"))
      db.run(`ALTER TABLE users ADD COLUMN passwordHash TEXT`);
    if (!have("role"))
      db.run(`ALTER TABLE users ADD COLUMN role TEXT
              CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'`);
  });

  /* BOXES */
  db.run(`
    CREATE TABLE IF NOT EXISTS boxes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      serial        TEXT UNIQUE,
      cycles        INTEGER DEFAULT 0,
      device_serial TEXT,
      departed      INTEGER DEFAULT 0,
      returned      INTEGER DEFAULT 0,
      is_checked    INTEGER DEFAULT 0,
      checked_by    TEXT
    )
  `);

  /* BOX_HISTORY */
  db.run(`
    CREATE TABLE IF NOT EXISTS box_history (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      box_id        INTEGER,
      device_serial TEXT,
      loaded_at     TEXT,
      unloaded_at   TEXT,
      checked_by    TEXT
    )
  `);
});

module.exports = db;
