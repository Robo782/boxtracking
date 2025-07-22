// server/scripts/fixStatus.js
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Pfad zu deiner DB - genauso wie in server/db.js
const dbFile = path.join(__dirname, "..", "db", "database.sqlite");
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  // neue Spalten nur anlegen, wenn sie fehlen
  db.run(`ALTER TABLE boxes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available'`);
  db.run(`ALTER TABLE boxes ADD COLUMN IF NOT EXISTS maintenance_count INTEGER DEFAULT 0`);

  // vorhandene Datensätze auf sinnvollen Status setzen
  db.run(`
    UPDATE boxes
       SET status = CASE
                      WHEN departed=1 AND returned=0 THEN 'departed'
                      WHEN returned=1 AND is_checked=0 THEN 'returned'
                      WHEN is_checked=1               THEN 'available'
                      ELSE 'available'
                    END
  `, (err) => {
    if (err) console.error("❌ Update failed:", err.message);
    else     console.log("✅ Spalten garantiert & Status korrigiert");
    db.close();
  });
});
