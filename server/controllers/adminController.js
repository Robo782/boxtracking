// server/controllers/adminController.js
const db = require('../db');

// Alle Verluste von Callback-Style entfernt.
// Die Wrapper aus db.js liefern Promises – also bleibt await gültig.

exports.resetData = async (_req, res) => {
  try {
    await db.run('DELETE FROM box_history');
    await db.run('DELETE FROM boxes');
    res.json({ message: 'Alle Daten wurden zurückgesetzt.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset fehlgeschlagen' });
  }
};

exports.initData = async (_req, res) => {
  try {
    // Tabelle anlegen (falls noch nicht vorhanden)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS boxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial TEXT UNIQUE,
        status TEXT DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS box_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        box_id INTEGER,
        action TEXT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Beispiel-Box, wenn DB frisch ist
    const row = await db.get('SELECT COUNT(*) AS cnt FROM boxes');
    if (row.cnt === 0) {
      await db.run('INSERT INTO boxes (serial) VALUES (?)', ['DEMO-0001']);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Init fehlgeschlagen' });
  }
};
