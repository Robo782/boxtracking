// server/db.js
//
// zentrale SQLite-Instanz + Promise-Wrapper
// ──────────────────────────────────────────────────────────────

const path     = require('node:path');
const fs       = require('node:fs');
const Database = require('better-sqlite3');

// ---------------------------------------------------------------------------
// 1) DB-Datei anlegen / öffnen
// ---------------------------------------------------------------------------
const DB_DIR  = path.join(__dirname, 'db');
const DB_FILE = path.join(DB_DIR, 'boxtracker.sqlite');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_FILE, { verbose: console.log });

// WAL = besseres Concurrency-Handling
db.pragma('journal_mode = WAL');

// ---------------------------------------------------------------------------
// 2) Schema (nur angelegt, wenn noch nicht vorhanden)
// ---------------------------------------------------------------------------
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      email         TEXT UNIQUE,
      passwordHash  TEXT NOT NULL,
      role          TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS boxes (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      serial            TEXT UNIQUE NOT NULL,
      status            TEXT CHECK (status IN
                       ('available','departed','returned','maintenance'))
                       DEFAULT 'available',
      cycles            INTEGER DEFAULT 0,
      maintenance_count INTEGER DEFAULT 0,
      device_serial     TEXT,
      pcc_id            TEXT,
      loaded_at         TEXT,
      unloaded_at       TEXT,
      checked_by        TEXT
  );

  CREATE TABLE IF NOT EXISTS box_history (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      box_id        INTEGER NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
      device_serial TEXT,
      pcc_id        TEXT,
      loaded_at     TEXT,
      unloaded_at   TEXT,
      checked_by    TEXT
  );
`);

// ---------------------------------------------------------------------------
// 3) Promise-Wrapper, damit wir überall `await db.get(...)` nutzen können
// ---------------------------------------------------------------------------
const promisify =
  (method) => (sql, ...params) =>
    new Promise((resolve, reject) => {
      try {
        const stmt  = db.prepare(sql);
        const value = stmt[method](...params);
        resolve(value);
      } catch (err) {
        reject(err);
      }
    });

module.exports = {
  get  : promisify("get"),
  all  : promisify("all"),
  run  : promisify("run"),
  exec : (sql) => Promise.resolve(_db.exec(sql)),
  raw  : _db,                 // direkter Zugriff
  prepare : _db.prepare.bind(_db)   // <- neu, falls irgendwo direkt benutzt
};
