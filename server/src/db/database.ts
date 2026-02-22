import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'poker.db');

let db: Database.Database;

export function getDb(): Database.Database {
    if (!db) {
        // Ensure data directory exists
        const fs = require('fs');
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initializeDb(db);
    }
    return db;
}

function initializeDb(db: Database.Database): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      game_type TEXT NOT NULL DEFAULT '',
      buy_in REAL NOT NULL DEFAULT 0,
      cash_out REAL NOT NULL DEFAULT 0,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
