const path = require('path');
const Database = require('better-sqlite3');

const DB_DIR = path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'data.db');

const db = new Database(DB_PATH, { verbose: console.log });

module.exports = db;
