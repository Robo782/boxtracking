// server/db.js
// ---------------------------------------------------------------------------
//  Promise-Wrapper um better-sqlite3  +  Convenience-Helfer
//  ▸ legt bei leerer Datenbank einen Default-Admin (admin / admin) an
//  ▸ EXPORTIERT DB_DIR / DB_FILE / DB_PATH  → andere Module holen sie nur hier
// ---------------------------------------------------------------------------
const path     = require("path");
const fs       = require("fs");
const bcrypt   = require("bcrypt");
const Database = require("better-sqlite3");

/* ───────── Konstanten ───────── */
const DB_DIR  = process.env.DB_DIR  || path.join(__dirname, "db");
const DB_FILE = process.env.DB_FILE || "data.sqlite";
const DB_PATH = path.join(DB_DIR, DB_FILE);

/* ───────── 1) Verzeichnis sicherstellen ───────── */
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

/* ───────── 2) DB öffnen ───────── */
const _db = new Database(DB_PATH);

/* ───────── 3) PRAGMAs & Tabellen (werden nur beim ersten Start angelegt) ─── */
_db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  /* ---------- Nutzer ---------- */
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE,
    passwordHash  TEXT NOT NULL,
    role          TEXT DEFAULT 'user'
  );

  /* ---------- Boxen ---------- */
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

  /* ---------- Historie ---------- */
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

/* ───────── 4) Default-Admin anlegen (nur wenn die Tabelle leer ist) ───────── */
const { cnt } = _db.prepare(`SELECT COUNT(*) AS cnt FROM users`).get();
if (cnt === 0) {
  const hash = bcrypt.hashSync("admin", 10);
  _db.prepare(`
      INSERT INTO users (username, email, passwordHash, role)
      VALUES ('admin', NULL, ?, 'admin')
  `).run(hash);
  console.warn("⚠︎ Default-Admin (admin / admin) angelegt");
}

/* ───────── 5) Promise-Helfer zur komfortablen Nutzung ───────── */
function execStmt(method, sql, params) {
  const stmt = _db.prepare(sql);

  // 0) keine Platzhalter im SQL  →  ohne Argumente ausführen
  if (!sql.includes("?")) return stmt[method]();

  // 1) params nicht gesetzt?
  if (params === undefined || params === null) return stmt[method]();

  // 2) leeres Array
  if (Array.isArray(params) && params.length === 0) return stmt[method]();

  // 3) Array mit Werten
  if (Array.isArray(params)) return stmt[method](...params);

  // 4) Einzelwert oder Objekt
  return stmt[method](params);
}

const get = (sql, params) => Promise.resolve(execStmt("get",  sql, params));
const all = (sql, params) => Promise.resolve(execStmt("all",  sql, params));
const run = (sql, params) => Promise.resolve(execStmt("run",  sql, params));

/* ───────── Export-API ───────── */
module.exports = {
  /* High-level */
  get,
  all,
  run,

  /* Low-level & Utility */
  exec    : (sql) => Promise.resolve(_db.exec(sql)),
  prepare : _db.prepare.bind(_db),
  raw     : _db,                 // direkter Zugriff falls nötig

  /* Konstanten für andere Module */
  DB_DIR,
  DB_FILE,
  DB_PATH
};
