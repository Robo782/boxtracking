// server/db.js
//
// Zentrale DB–Abstraktion, die dieselbe API wie das alte sqlite3-Objekt
// bereitstellt, intern aber auf „better-sqlite3“ setzt (synchrone Engine).
//
//  db.run(sql, [params])
//  db.get(sql, [params])
//  db.all(sql, [params])
//  db.exec(sql)
//
//  ➜  KEIN Callback-Style mehr nötig.
//  ➜  Alle Aufrufe können – müssen aber nicht – mit await benutzt werden.
//      (die Funktionen geben synchron Werte zurück, aber ein Promise.resolve
//       umschließt sie, sodass `await db.get()` weiter funktioniert)

const path  = require('path');
const fs    = require('fs');
const Database = require('better-sqlite3');

// 1) Pfad ermitteln ----------------------------------------------------------
const DISK_PATH = process.env.RENDER_DISK || '/app/server/db';   // Render-Disk
fs.mkdirSync(DISK_PATH, { recursive: true });

const DB_FILE   = process.env.DB_FILE   ||
                  path.join(DISK_PATH, 'database.sqlite');

// 2) Datenbank öffnen --------------------------------------------------------
const raw = new Database(DB_FILE);

// 3) Kompatibilitäts-Wrapper -------------------------------------------------
function promisify(fn) {
  return (...args) => Promise.resolve().then(() => fn(...args));
}
const db = {
  run : promisify((sql, params = []) => raw.prepare(sql).run(params)),
  get : promisify((sql, params = []) => raw.prepare(sql).get(params)),
  all : promisify((sql, params = []) => raw.prepare(sql).all(params)),
  exec: promisify(raw.exec.bind(raw)),
  transaction: raw.transaction.bind(raw)
};

module.exports = db;
