const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './incident.db';
const db = new Database(path.resolve(DB_PATH));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      zone TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'ACCIDENT',
      severity TEXT NOT NULL DEFAULT 'MEDIUM',
      description TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  console.log('Incident DB initialized');
}

module.exports = { db, initDb };
