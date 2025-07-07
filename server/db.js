// server/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(
  path.resolve(__dirname, "database.sqlite"),
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

// ────────────────────────────────────────────────────────────
// Tabellen anlegen / anpassen
// ────────────────────────────────────────────────────────────
db.serialize(() => {
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA busy_timeout = 5000");

  // USERS ─ jetzt mit ROLE
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'
    )`
  );

  // Falls „role“ nachträglich fehlt → hinzufügen
  db.all(`PRAGMA table_info(users)`, (err, cols) => {
    if (err) console.error(err);
    if (!cols.find(c => c.name === "role")) {
      db.run(
        `ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'`
      );
    }
  });

  // BOXES & HISTORY bleiben, nur zur Info hier gekürzt
  db.run(`CREATE TABLE IF NOT EXISTS boxes (
    id INTEGER PRIMARY KEY,
    serial TEXT UNIQUE,
    cycles INTEGER DEFAULT 0,
    device_serial TEXT,
    departed INTEGER DEFAULT 0,
    returned INTEGER DEFAULT 0,
    is_checked INTEGER DEFAULT 0,
    checked_by TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS box_history (
    id INTEGER PRIMARY KEY,
    box_id INTEGER,
    device_serial TEXT,
    loaded_at TEXT,
    unloaded_at TEXT,
    checked_by TEXT
  )`);
});

module.exports = db;
