// server/db.js
// ------------------------------------------------------------
//  einfache Promise-Hülle um better-sqlite3
// ------------------------------------------------------------
const path     = require("path");
const fs       = require("fs");
const Database = require("better-sqlite3");

const DB_DIR  = process.env.DB_DIR  || path.join(__dirname, "db");
const DB_FILE = process.env.DB_FILE || "data.sqlite";

// 1) Verzeichnis sicherstellen  ───────────────────────────────
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// 2) DB öffnen  ───────────────────────────────────────────────
const db = new Database(path.join(DB_DIR, DB_FILE));

// 3) PRAGMA-s & Tabellen (nur beim ersten Start wird angelegt) ─
db.exec(`
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

// 4) Default-Admin anlegen (einmalig)  ─────────────────────────
(() => {
  const { cnt } = db.prepare("SELECT COUNT(*) AS cnt FROM users").get();
  if (cnt === 0) {
    const bcrypt = require("bcrypt");
    const hash   = bcrypt.hashSync("admin", 10);      // Passwort: admin
    db.prepare(`
      INSERT INTO users (username, email, passwordHash, role)
      VALUES ('admin', 'admin@example.com', ?, 'admin')
    `).run(hash);
    console.log("⚠︎ Default-Admin (admin / admin) angelegt");
  }
})();

// 5) Promise-Wrapper  ─────────────────────────────────────────
function wrap(fn) {
  return (...args) =>
    new Promise((resolve, reject) => {
      try {
        resolve(db[fn](...args));
      } catch (err) {
        reject(err);
      }
    });
}

// 6) Export-API  ──────────────────────────────────────────────
module.exports = {
  /* Standard-Aufrufe als Promise */
  get : (...args) => wrap("prepare")(...args).then(st => st.get()),
  all : (...args) => wrap("prepare")(...args).then(st => st.all()),
  run : (...args) => wrap("prepare")(...args).then(st => st.run()),

  /* Convenience */
  exec    : (sql) => Promise.resolve(db.exec(sql)),
  prepare : db.prepare.bind(db),

  /* direkter Zugriff */
  raw  : db
};
