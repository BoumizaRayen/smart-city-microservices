const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './traffic.db';
const db = new Database(path.resolve(DB_PATH));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS traffic (
      id TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      zone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'FREE',
      congestion_level INTEGER NOT NULL DEFAULT 0,
      road_condition TEXT NOT NULL DEFAULT 'NORMAL',
      updated_at TEXT NOT NULL
    )
  `);
  console.log('Traffic DB initialized');
}

module.exports = { db, initDb };
