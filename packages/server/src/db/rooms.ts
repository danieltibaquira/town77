import type { GameConfig, GameState } from '@town77/shared-types'
import type Database from 'better-sqlite3'

export interface RoomRow {
  code: string
  theme_id: string
  config_json: string
  state_json: string
  seed: number
  created_at: number
  updated_at: number
}

export function createRoom(
  db: Database.Database,
  params: { code: string; themeId: string; config: GameConfig; state: GameState; seed: number },
): void {
  const now = Date.now()
  db.prepare(
    `INSERT INTO rooms (code, theme_id, config_json, state_json, seed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    params.code,
    params.themeId,
    JSON.stringify(params.config),
    JSON.stringify(params.state),
    params.seed,
    now,
    now,
  )
}

export function getRoom(db: Database.Database, code: string): RoomRow | undefined {
  return db.prepare('SELECT * FROM rooms WHERE code = ?').get(code) as RoomRow | undefined
}

export function updateRoomState(db: Database.Database, code: string, state: GameState): void {
  db.prepare('UPDATE rooms SET state_json = ?, updated_at = ? WHERE code = ?').run(
    JSON.stringify(state),
    Date.now(),
    code,
  )
}
