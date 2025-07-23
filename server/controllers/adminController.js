/**
 * Controller-Funktionen für Admin-Endpoints
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const db = require('../db');          // besser-sqlite3 Wrapper
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);

/* ─ helpers ─────────────────────────────────────────────────────────────── */

const HISTORY_TABLE = 'box_history';
const BOX_TABLE      = 'boxes';
const DB_DIR         = path.join(__dirname, 'db');
const DB_PATH        = path.join(DB_DIR, 'data.db');
const BACKUP_DIR     = path.join(DB_DIR, 'backup');

/* ─ controller ──────────────────────────────────────────────────────────── */

exports.getStats = (_req, res) => {
  try {
    const totalBoxes   = db.prepare(`SELECT COUNT(*) AS n FROM ${BOX_TABLE}`).get().n;
    const totalHistory = db.prepare(`SELECT COUNT(*) AS n FROM ${HISTORY_TABLE}`).get().n;

    res.json({ totalBoxes, totalHistory });
  } catch (err) {
    console.error('getStats:', err);
    res.status(500).json({ error: 'DB Error' });
  }
};

exports.resetData = async (_req, res) => {
  try {
    const trx = db.transaction(() => {
      db.prepare(`DELETE FROM ${HISTORY_TABLE}`).run();
      db.prepare(`DELETE FROM ${BOX_TABLE}`).run();
    });
    trx();
    res.json({ ok: true, message: 'Alle Daten gelöscht.' });
  } catch (err) {
    console.error('resetData:', err);
    res.status(500).json({ error: 'DB Error' });
  }
};

exports.createBackup = async (_req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const zipName = `backup_${Date.now()}.zip`;
    const zipPath = path.join(BACKUP_DIR, zipName);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.file(DB_PATH, { name: 'data.db' });
    await archive.finalize();

    res.download(zipPath, zipName, async () => {
      /** nach Auslieferung Aufräumen */
      await unlinkAsync(zipPath).catch(() => {});
    });
  } catch (err) {
    console.error('createBackup:', err);
    res.status(500).json({ error: 'Backup Error' });
  }
};

exports.restoreBackup = async (req, res) => {
  try {
    if (!req.files?.backup) {
      return res.status(400).json({ error: 'Keine Backup-Datei hochgeladen.' });
    }

    const uploaded = req.files.backup;
    const tempPath = path.join(DB_DIR, `restore_${Date.now()}.db`);

    await uploaded.mv(tempPath);                 // via express-fileupload

    fs.copyFileSync(tempPath, DB_PATH);
    await unlinkAsync(tempPath);

    res.json({ ok: true, message: 'Backup eingespielt.' });
  } catch (err) {
    console.error('restoreBackup:', err);
    res.status(500).json({ error: 'Restore Error' });
  }
};
