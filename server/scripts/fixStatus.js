// server/scripts/fixStatus.js
const path    = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbFile = path.join(__dirname, "..", "db", "database.sqlite");
const db     = new sqlite3.Database(dbFile);

function columnExists(cols, name) {
  return cols.some(c => c.name === name);
}

db.serialize(() => {
  db.all("PRAGMA table_info(boxes)", (err, cols) => {
    if (err) return console.error("PRAGMA failed:", err.message);

    if (!columnExists(cols, "status")) {
      console.log("➕  füge Spalte 'status' hinzu …");
      db.run("ALTER TABLE boxes ADD COLUMN status TEXT DEFAULT 'available'");
    }

    if (!columnExists(cols, "maintenance_count")) {
      console.log("➕  füge Spalte 'maintenance_count' hinzu …");
      db.run("ALTER TABLE boxes ADD COLUMN maintenance_count INTEGER DEFAULT 0");
    }

    /* Status der vorhandenen Zeilen angleichen */
    db.run(`
      UPDATE boxes
         SET status = CASE
                        WHEN departed=1 AND returned=0 THEN 'departed'
                        WHEN returned=1 AND is_checked=0 THEN 'returned'
                        WHEN is_checked=1               THEN 'available'
                        ELSE 'available'
                      END
    `, (e) => {
      if (e) console.error("Update failed:", e.message);
      else   console.log("✅ Patch abgeschlossen – DB ist konsistent");
      db.close();
    });
  });
});
