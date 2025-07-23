// server/db.js  ← Datei komplett ersetzen
const sqlite3 = require("sqlite3").verbose();
const fs      = require("fs");
const path    = require("path");

/* ─── Wo speichern? ───────────────────────────────────────── */

const explicit = process.env.DB_FILE;          // kannst du in Render → Env vars setzen
const diskDir  = "/persistent"                      // Default-Mount von Render-Disk
const hasDisk  = fs.existsSync(diskDir);
const dir      = explicit ? path.dirname(explicit)
             : hasDisk   ? diskDir
             : path.join(__dirname, "db");

fs.mkdirSync(dir, { recursive: true });

const dbFile   = explicit || (hasDisk
                  ? path.join(diskDir, "boxtracker.sqlite")
                  : path.join(dir, "database.sqlite"));

/* ─── Verbindung ─────────────────────────────────────────── */
const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

/* ─── Schema-Self-Healing ────────────────────────────────── */
const colExists = (cols, n) => cols.some(c => c.name === n);

db.serialize(() => {
  db.run("PRAGMA journal_mode=WAL");
  db.run("PRAGMA busy_timeout=5000");

  /* USERS */
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      passwordHash TEXT,
      role TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'
    )`);

  /* BOXES – vollständiges neues Schema */
  db.run(`
    CREATE TABLE IF NOT EXISTS boxes (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      serial            TEXT UNIQUE,
      cycles            INTEGER DEFAULT 0,
      maintenance_count INTEGER DEFAULT 0,
      status            TEXT    DEFAULT 'available',
      device_serial     TEXT,
      pcc_id            TEXT,
      departed          INTEGER DEFAULT 0,
      returned          INTEGER DEFAULT 0,
      is_checked        INTEGER DEFAULT 0,
      checked_by        TEXT,
      loaded_at         TEXT,
      unloaded_at       TEXT
    )`);

  db.all("PRAGMA table_info(boxes)", (_, cols) => {
    const add = (n, def) =>
      db.run(`ALTER TABLE boxes ADD COLUMN ${n} ${def}`);

    if (!colExists(cols, "maintenance_count")) add("maintenance_count", "INTEGER DEFAULT 0");
    if (!colExists(cols, "status"))             add("status",             "TEXT DEFAULT 'available'");
    if (!colExists(cols, "loaded_at"))          add("loaded_at",          "TEXT");
    if (!colExists(cols, "unloaded_at"))        add("unloaded_at",        "TEXT");
    if (!colExists(cols, "checked_by"))         add("checked_by",         "TEXT");
  });

  /* BOX_HISTORY */
  db.run(`
    CREATE TABLE IF NOT EXISTS box_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      box_id        INTEGER,
      device_serial TEXT,
      pcc_id        TEXT,
      loaded_at     TEXT,
      unloaded_at   TEXT,
      checked_by    TEXT
    )`);

  db.all("PRAGMA table_info(box_history)", (_, cols) => {
    if (!colExists(cols, "pcc_id"))
      db.run("ALTER TABLE box_history ADD COLUMN pcc_id TEXT");
  });
});

module.exports = db;
