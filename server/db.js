/**
 * SQLite-Initialisierung + Schema-Self-Healing
 * -------------------------------------------
 * – Persistente Render-Disk ist auf  /app/server/db  gemountet.
 * – Alternativ kann der Pfad per  DB_FILE=/abs/path.db  überschrieben werden.
 */
const sqlite3 = require("sqlite3").verbose();
const fs      = require("fs");
const path    = require("path");

/* ── Pfad bestimmen ─────────────────────────────────────── */
const defaultDir  = path.join(__dirname, "db");
const dbFile      = process.env.DB_FILE
                  || path.join(defaultDir, "database.sqlite");

/* Ordner anlegen, falls er noch nicht existiert */
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

/* ── Verbindung öffnen ─────────────────────────────────── */
const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

/* Helper */
const colExists = (cols, n) => cols.some(c => c.name === n);

/* ── Schema + Migration ─────────────────────────────────── */
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
    )
  `);

  /* BOXES */
  db.run(`
    CREATE TABLE IF NOT EXISTS boxes (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      serial            TEXT UNIQUE,
      cycles            INTEGER DEFAULT 0,
      maintenance_count INTEGER DEFAULT 0,
      status            TEXT DEFAULT 'available',
      device_serial     TEXT,
      pcc_id            TEXT,
      departed          INTEGER DEFAULT 0,
      returned          INTEGER DEFAULT 0,
      is_checked        INTEGER DEFAULT 0,
      checked_by        TEXT,
      loaded_at         TEXT,
      unloaded_at       TEXT
    )
  `);

  db.all("PRAGMA table_info(boxes)", (_, cols) => {
    const add = (n, def) => db.run(`ALTER TABLE boxes ADD COLUMN ${n} ${def}`);
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
    )
  `);

  db.all("PRAGMA table_info(box_history)", (_, cols) => {
    if (!colExists(cols, "pcc_id"))
      db.run("ALTER TABLE box_history ADD COLUMN pcc_id TEXT");
  });
});
/* ── bei leerer DB automatisch Demo-Boxen erzeugen ───────── */
const admin = require("./controllers/adminController");
admin.initData(null, null);


module.exports = db;
module.exports.DB_FILE = dbFile;           // <- für Backup-Controller
