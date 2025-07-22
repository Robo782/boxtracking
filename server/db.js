// server/db.js
// ────────────────────────────────────────────────────────────
// SQLite-Initialisierung + Migration
// DB-Datei liegt auf der Render-Disk  /app/server/db/
// ────────────────────────────────────────────────────────────
const sqlite3 = require("sqlite3").verbose();
const path    = require("path");
const fs      = require("fs");

// Ordner anlegen (Render Disk ist hier eingehängt)
const dbDir  = path.join(__dirname, "db");
const dbFile = path.join(dbDir, "database.sqlite");
fs.mkdirSync(dbDir, { recursive: true });

// DB öffnen / erzeugen
const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

// ─── Migration ──────────────────────────────────────────────
db.serialize(() => {
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA busy_timeout = 5000");

  /* ---------- USERS --------------------------------------- */
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT UNIQUE,
      passwordHash TEXT,
      role         TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'
    )
  `);
  db.all(`PRAGMA table_info(users)`, (err, cols) => {
    if (err) return console.error(err);
    const have = n => cols.some(c => c.name === n);
    if (!have("username"))     db.run(`ALTER TABLE users ADD COLUMN username TEXT`);
    if (!have("passwordHash")) db.run(`ALTER TABLE users ADD COLUMN passwordHash TEXT`);
    if (!have("role"))         db.run(`ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'`);
  });

  /* ---------- BOXES --------------------------------------- */
  db.run(`
    CREATE TABLE IF NOT EXISTS boxes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      serial        TEXT UNIQUE,
      cycles        INTEGER DEFAULT 0,
      maintenance_count INTEGER DEFAULT 0,       -- ★ NEU
      status        TEXT  DEFAULT 'available',   -- ★ NEU
      device_serial TEXT,
      pcc_id        TEXT,
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

    if (!have("is_checked"))
      db.run(`ALTER TABLE boxes ADD COLUMN is_checked INTEGER DEFAULT 0`);

    /* ★ neue Spalten nur hinzufügen, wenn sie noch fehlen */
    if (!have("status"))
      db.run(`ALTER TABLE boxes ADD COLUMN status TEXT DEFAULT 'available'`);

    if (!have("maintenance_count"))
      db.run(`ALTER TABLE boxes ADD COLUMN maintenance_count INTEGER DEFAULT 0`);
  });

  /* ---------- BOX_HISTORY --------------------------------- */
  db.run(`
    CREATE TABLE IF NOT EXISTS box_history (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      box_id        INTEGER,
      device_serial TEXT,
      pcc_id        TEXT,              -- ★ NEU
      loaded_at     TEXT,
      unloaded_at   TEXT,
      checked_by    TEXT
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
