import Database from 'better-sqlite3'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS rooms (
  code        TEXT PRIMARY KEY,
  theme_id    TEXT NOT NULL,
  config_json TEXT NOT NULL,
  state_json  TEXT NOT NULL,
  seed        INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id            TEXT PRIMARY KEY,
  room_code     TEXT NOT NULL REFERENCES rooms(code),
  name          TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_code);
`

export function applyMigrations(db: Database.Database): void {
  db.exec(SCHEMA)
}

export function openDatabase(path: string): Database.Database {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  applyMigrations(db)
  return db
}
