// server/db.js
// ───────────────────────────────────────────────────────────────────────────
//  better-sqlite3-Wrapper  +  garantiert idempotenten Default-Admin
// ───────────────────────────────────────────────────────────────────────────
const path     = require("path");
const fs       = require("fs");
const bcrypt   = require("bcrypt");
const Database = require("better-sqlite3");

const DB_DIR  = process.env.DB_DIR  || path.join(__dirname, "db");
const DB_FILE = process.env.DB_FILE || "data.sqlite";
const DB_PATH = path.join(DB_DIR, DB_FILE);

// Verzeichnis anlegen, falls nötig
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// DB öffnen
const _db = new Database(DB_PATH);

// Grund-PRAGMAs + Tabellen
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
    status            TEXT CHECK (
                     status IN ('available','departed','returned','maintenance')
                   ) DEFAULT 'available',
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

/* ───── sicherstellen, dass ein funktionierender Admin vorhanden ist ───── */
const admin = _db.prepare(`
  SELECT passwordHash FROM users WHERE username = 'admin' LIMIT 1
`).get();

if (!admin || !admin.passwordHash) {
  const hash = bcrypt.hashSync("admin", 10);

  if (admin) {
    _db.prepare(`
      UPDATE users SET passwordHash=? WHERE username='admin'
    `).run(hash);
  } else {
    _db.prepare(`
      INSERT INTO users (username,email,passwordHash,role)
      VALUES ('admin','admin@example.com',?, 'admin')
    `).run(hash);
  }
  console.warn("⚠︎ Default-Admin (admin / admin) angelegt bzw. repariert");
}

/* ───── kleine Promise-Helfer ───── */
function execStmt(method, sql, params) {
  const stmt = _db.prepare(sql);
  if (!sql.includes("?"))                     return stmt[method]();
  if (params === undefined || params === null) return stmt[method]();
  if (Array.isArray(params) && !params.length) return stmt[method]();
  return Array.isArray(params)
    ? stmt[method](...params)
    : stmt[method](params);
}

const get = (sql,p)=>Promise.resolve(execStmt("get",sql,p));
const all = (sql,p)=>Promise.resolve(execStmt("all",sql,p));
const run = (sql,p)=>Promise.resolve(execStmt("run",sql,p));

module.exports = {
  get, all, run,
  exec   : (sql)=>Promise.resolve(_db.exec(sql)),
  prepare: _db.prepare.bind(_db),
  raw    : _db,
  DB_DIR, DB_FILE, DB_PATH
};
