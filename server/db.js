// ------------------------------------------------------------
//  Promise-Wrapper um better-sqlite3 + ein paar Convenience-Helfer
// ------------------------------------------------------------
const path     = require("path");
const fs       = require("fs");
const Database = require("better-sqlite3");

const DB_DIR  = process.env.DB_DIR  || path.join(__dirname, "db");
const DB_FILE = process.env.DB_FILE || "data.sqlite";
const DB_PATH = path.join(DB_DIR, DB_FILE);

// 1) Verzeichnis anlegen, falls nötig
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// 2) Datenbank öffnen
const _db = new Database(DB_PATH);

// 3) Basis-PRAGMAs & Tabellen – werden nur beim ersten Start angelegt
_db.exec(`
  PRAGMA journal_mode = WAL;
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

// 4) Promise-basierte Helfer
const get = (sql, params = []) =>
  Promise.resolve(_db.prepare(sql).get(params));

const all = (sql, params = []) =>
  Promise.resolve(_db.prepare(sql).all(params));

const run = (sql, params = []) =>
  Promise.resolve(_db.prepare(sql).run(params));

// 5) Export-API
module.exports = {
  /* Standard-Abfragen */
  get,
  all,
  run,

  /* Convenience / direkte Zugriffe */
  exec    : (sql) => Promise.resolve(_db.exec(sql)),
  prepare : _db.prepare.bind(_db),

  /* low-level Zugriff, falls man wirklich muss */
  raw     : _db,

  /* nützliche Pfade für andere Module (Backup, Restore, Tests …) */
  DB_DIR,
  DB_FILE,
  DB_PATH
};
