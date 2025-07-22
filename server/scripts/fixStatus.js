const path    = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbFile = path.join(__dirname, "..", "db", "database.sqlite");
const db     = new sqlite3.Database(dbFile);

function colExists(cols, name) {
  return cols.some(c => c.name === name);
}

db.serialize(() => {
  db.all("PRAGMA table_info(boxes)", (err, cols) => {
    if (err) throw err;

    const add = (name, def) =>
      db.run(`ALTER TABLE boxes ADD COLUMN ${name} ${def}`, console.log(`➕  ${name}`));

    if (!colExists(cols, "status"))
      add("status",             "TEXT    DEFAULT 'available'");

    if (!colExists(cols, "maintenance_count"))
      add("maintenance_count",  "INTEGER DEFAULT 0");

    if (!colExists(cols, "loaded_at"))
      add("loaded_at",          "TEXT");

    if (!colExists(cols, "unloaded_at"))
      add("unloaded_at",        "TEXT");

    if (!colExists(cols, "checked_by"))
      add("checked_by",         "TEXT");

    /* vorhandene Zeilen auf gültigen Status setzen */
    db.run(`
      UPDATE boxes
         SET status = CASE
                        WHEN departed  =1 AND returned =0 THEN 'departed'
                        WHEN returned  =1 AND is_checked=0 THEN 'returned'
                        WHEN is_checked=1               THEN 'available'
                        ELSE 'available'
                      END
    `, () => {
      console.log("✅  Spalten vorhanden & Daten konsistent");
      db.close();
    });
  });
});
