import type Database from 'better-sqlite3'

export interface PlayerRow {
  id: string
  room_code: string
  name: string
  session_token: string
  created_at: number
}

export function createPlayer(
  db: Database.Database,
  params: { id: string; roomCode: string; name: string; sessionToken: string },
): void {
  db.prepare(
    'INSERT INTO players (id, room_code, name, session_token, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(params.id, params.roomCode, params.name, params.sessionToken, Date.now())
}

export function getPlayerByToken(
  db: Database.Database,
  sessionToken: string,
): PlayerRow | undefined {
  return db.prepare('SELECT * FROM players WHERE session_token = ?').get(sessionToken) as
    | PlayerRow
    | undefined
}

export function getPlayersByRoom(db: Database.Database, roomCode: string): PlayerRow[] {
  return db
    .prepare('SELECT * FROM players WHERE room_code = ? ORDER BY created_at ASC')
    .all(roomCode) as PlayerRow[]
}
