import type Database from 'better-sqlite3';

export function initializeDatabase(db: Database.Database): void {
  try {
    db.pragma('journal_mode = WAL');
  } catch {
    try {
      db.pragma('journal_mode = DELETE');
    } catch {
      // Ignore if filesystem restricts pragma changes
    }
  }

  try {
    db.pragma('foreign_keys = ON');
  } catch {
    // Ignore
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      normalized_url TEXT NOT NULL,
      platform TEXT NOT NULL,
      title TEXT,
      description TEXT,
      thumbnail_url TEXT,
      author_name TEXT,
      shared_text TEXT,
      extracted_text TEXT,
      summary TEXT,
      category TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      content_type TEXT,
      ai_status TEXT NOT NULL DEFAULT 'pending',
      ai_confidence REAL,
      ai_error TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, normalized_url)
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_normalized ON bookmarks(user_id, normalized_url);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(user_id, category);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_platform ON bookmarks(user_id, platform);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_ai_status ON bookmarks(ai_status);
  `);
}
