// server/db.js
const path     = require("path");
const fs       = require("fs");
const bcrypt   = require("bcrypt");
const Database = require("better-sqlite3");

const DB_DIR  = process.env.DB_DIR  || path.join(__dirname, "db");
const DB_FILE = process.env.DB_FILE || "data.sqlite";
const DB_PATH = path.join(DB_DIR, DB_FILE);

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const _db = new Database(DB_PATH);

/* Basis-PRAGMAs & Tabellen */
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
    status            TEXT CHECK (status IN ('available','departed','returned','maintenance','damaged'))
                       DEFAULT 'available',
    cycles            INTEGER DEFAULT 0,
    maintenance_count INTEGER DEFAULT 0,
    device_serial     TEXT,
    pcc_id            TEXT,
    loaded_at         TEXT,
    unloaded_at       TEXT,
    checked_by        TEXT,
    damaged_at        TEXT,
    damage_reason     TEXT
  );

  CREATE TABLE IF NOT EXISTS box_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    box_id        INTEGER NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
    device_serial TEXT,
    pcc_id        TEXT,
    loaded_at     TEXT,
    unloaded_at   TEXT,
    checked_by    TEXT,
    damaged       INTEGER DEFAULT 0,      -- 0/1
    damage_reason TEXT
  );
`);

/* Migrations: fehlende Spalten anlegen (idempotent) */
function hasColumn(table, col){
  const row = _db.prepare(`PRAGMA table_info(${table})`).all().find(r=>r.name===col);
  return !!row;
}
function migrate() {
  const alters = [];
  if (!hasColumn("boxes","damaged_at"))     alters.push(`ALTER TABLE boxes ADD COLUMN damaged_at TEXT`);
  if (!hasColumn("boxes","damage_reason"))  alters.push(`ALTER TABLE boxes ADD COLUMN damage_reason TEXT`);
  if (!hasColumn("box_history","damaged"))  alters.push(`ALTER TABLE box_history ADD COLUMN damaged INTEGER DEFAULT 0`);
  if (!hasColumn("box_history","damage_reason")) alters.push(`ALTER TABLE box_history ADD COLUMN damage_reason TEXT`);
  alters.forEach(sql => { try { _db.exec(sql); } catch(e) {} });
}
migrate();

/* Admin immer setzen */
function ensureAdmin() {
  const hash = bcrypt.hashSync("admin", 10);
  _db.exec(`
    INSERT INTO users (username, email, passwordHash, role)
    VALUES ('admin', 'admin@example.com', '${hash}', 'admin')
    ON CONFLICT(username) DO UPDATE
      SET passwordHash='${hash}', email='admin@example.com', role='admin';
  `);
  console.warn("⚠︎ Default-Admin-Passwort auf „admin“ gesetzt");
}
ensureAdmin();

/* kleine Promise-Wrapper */
function execStmt(method, sql, p) {
  const s = _db.prepare(sql);
  if (!sql.includes("?")) return s[method]();
  if (p == null || (Array.isArray(p) && !p.length)) return s[method]();
  return Array.isArray(p) ? s[method](...p) : s[method](p);
}
const get = (q,p)=>Promise.resolve(execStmt("get", q,p));
const all = (q,p)=>Promise.resolve(execStmt("all",q,p));
const run = (q,p)=>Promise.resolve(execStmt("run",q,p));

module.exports = {
  get, all, run,
  exec   : (q)=>Promise.resolve(_db.exec(q)),
  prepare: _db.prepare.bind(_db),
  raw    : _db,
  ensureAdmin,
  DB_DIR, DB_FILE, DB_PATH
};
