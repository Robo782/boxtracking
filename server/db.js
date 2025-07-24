// ------------------------------------------------------------
//  Promise-Wrapper um better-sqlite3  +  Convenience-Helfer
//  (inkl. Default-Admin ‘admin / admin’)
// ------------------------------------------------------------
const path     = require("path");
const fs       = require("fs");
const bcrypt   = require("bcrypt");
const Database = require("better-sqlite3");

const DB_DIR  = process.env.DB_DIR  || path.join(__dirname, "db");
const DB_FILE = process.env.DB_FILE || "data.sqlite";
const DB_PATH = path.join(DB_DIR, DB_FILE);

// 1) Verzeichnis anlegen, falls nötig
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// 2) DB öffnen
const _db = new Database(DB_PATH);

// 3) PRAGMAs + Tabellen (nur beim ersten Start angelegt)
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

/* ───────── Default-Admin (nur bei leerer User-Tabelle) ───────── */
const { cnt } = _db.prepare(`SELECT COUNT(*) AS cnt FROM users`).get();
if (cnt === 0) {
  const hash = bcrypt.hashSync("admin", 10);
  _db.prepare(`
      INSERT INTO users (username, email, passwordHash, role)
      VALUES ('admin', NULL, ?, 'admin')
  `).run(hash);
  console.warn("⚠︎ Default-Admin (admin / admin) angelegt");
}

/* ───────── Promise-Helper (korrekte Parameter-Übergabe!) ─────── */
function execStmt(method, sql, params = []) {
  const stmt = _db.prepare(sql);
  // Array-Parameter → spreaden, Objekt / undefined → direkt
  if (Array.isArray(params)) return stmt[method](...params);
  return stmt[method](params);
}

const get = (sql, params) => Promise.resolve(execStmt("get",  sql, params));
const all = (sql, params) => Promise.resolve(execStmt("all",  sql, params));
const run = (sql, params) => Promise.resolve(execStmt("run",  sql, params));

/* ───────── Export-API ───────── */
module.exports = {
  get,
  all,
  run,

  exec    : (sql) => Promise.resolve(_db.exec(sql)),
  prepare : _db.prepare.bind(_db),
  raw     : _db,

  DB_DIR,
  DB_FILE,
  DB_PATH
};
