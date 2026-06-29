import Database from 'better-sqlite3'
import { resolve } from 'path'
import { existsSync, mkdirSync } from 'fs'

const DATA_DIR = resolve(import.meta.dirname, '../../data')
mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = resolve(DATA_DIR, 'yi.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    migrate(db)
  }
  return db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      profile TEXT NOT NULL DEFAULT 'default',
      source TEXT NOT NULL DEFAULT 'cli',
      agent TEXT,
      coding_agent_id TEXT,
      coding_agent_mode TEXT,
      title TEXT NOT NULL DEFAULT '',
      workspace TEXT,
      model TEXT,
      provider TEXT,
      base_url TEXT,
      api_key TEXT,
      api_mode TEXT,
      parent_session_id TEXT,
      fork_point_message_id TEXT,
      parent_title TEXT,
      parent_last_message TEXT,
      parent_last_message_role TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      ended_at INTEGER,
      last_active_at INTEGER,
      message_count INTEGER NOT NULL DEFAULT 0,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      context_tokens INTEGER
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      reasoning TEXT,
      tool_name TEXT,
      tool_call_id TEXT,
      tool_args TEXT,
      tool_result TEXT,
      tool_status TEXT,
      finish_reason TEXT,
      run_marker TEXT,
      token_count INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_profile ON sessions(profile);
  `)
}

export function closeDb() {
  if (db) {
    db.close()
  }
}
