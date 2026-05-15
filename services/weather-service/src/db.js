const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './weather.db';
const db = new Database(path.resolve(DB_PATH));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS weather (
      id TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      temperature REAL NOT NULL DEFAULT 20.0,
      wind_speed REAL NOT NULL DEFAULT 0.0,
      rainfall REAL NOT NULL DEFAULT 0.0,
      condition TEXT NOT NULL DEFAULT 'CLEAR',
      is_dangerous INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `);
  console.log('Weather DB initialized');
}

module.exports = { db, initDb };
