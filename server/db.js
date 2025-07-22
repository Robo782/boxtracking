// server/db.js  (vollständig)

const sqlite3 = require("sqlite3").verbose();
const path    = require("path");
const fs      = require("fs");

/* 1️⃣  Pfad-Strategie
   ────────────────
   A) Gibt es eine alte DB direkt unter /server?
      →  weiter­verwenden!
   B) Sonst  /server/db/database.sqlite  nehmen.            */
const oldPath = path.join(__dirname, "database.sqlite");
const newDir  = path.join(__dirname, "db");
const newPath = path.join(newDir, "database.sqlite");

const dbFile  = fs.existsSync(oldPath) ? oldPath : newPath;
if (!fs.existsSync(path.dirname(dbFile))) fs.mkdirSync(path.dirname(dbFile), { recursive: true });

/* 2️⃣  Verbindung öffnen */
const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

/* 3️⃣  Migrationen */
db.serialize(() => {
  db.run("PRAGMA journal_mode=WAL");
  db.run("PRAGMA busy_timeout=5000");

  /* USERS – unverändert */
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      passwordHash TEXT,
      role TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'
    )`);

  /* BOXES – neue Spalten bei Bedarf anlegen */
  db.run(`
    CREATE TABLE IF NOT EXISTS boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial TEXT UNIQUE,
      cycles INTEGER DEFAULT 0,
      maintenance_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available',
      device_serial TEXT,
      pcc_id TEXT,
      departed INTEGER DEFAULT 0,
      returned INTEGER DEFAULT 0,
      is_checked INTEGER DEFAULT 0,
      checked_by TEXT
    )`);

  db.all(`PRAGMA table_info(boxes)`, (_, cols) => {
    const have = n => cols.some(c => c.name === n);

    if (!have("status"))
      db.run(`ALTER TABLE boxes ADD COLUMN status TEXT DEFAULT 'available'`);

    if (!have("maintenance_count"))
      db.run(`ALTER TABLE boxes ADD COLUMN maintenance_count INTEGER DEFAULT 0`);
  });

  /* BOX_HISTORY – unverändert */
  db.run(`
    CREATE TABLE IF NOT EXISTS box_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      box_id INTEGER,
      device_serial TEXT,
      pcc_id TEXT,
      loaded_at TEXT,
      unloaded_at TEXT,
      checked_by TEXT
    )`);
});

module.exports = db;
