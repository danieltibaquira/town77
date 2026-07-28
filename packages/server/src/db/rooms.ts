import type Database from 'better-sqlite3'
import type { AnyGameState, CafeQueueConfig, GameConfig } from '@town77/shared-types'
import { isCafeQueueState } from '@town77/shared-types'

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
  params: { code: string; themeId: string; config: GameConfig | CafeQueueConfig; state: AnyGameState; seed: number },
): void {
  const now = Date.now()
  db.prepare(
    `INSERT INTO rooms (code, theme_id, config_json, state_json, seed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(params.code, params.themeId, JSON.stringify(params.config), JSON.stringify(params.state), params.seed, now, now)
}

export function getRoom(db: Database.Database, code: string): RoomRow | undefined {
  return db.prepare('SELECT * FROM rooms WHERE code = ?').get(code) as RoomRow | undefined
}

export function updateRoomState(db: Database.Database, code: string, state: AnyGameState): void {
  db.prepare('UPDATE rooms SET state_json = ?, updated_at = ? WHERE code = ?').run(
    JSON.stringify(state),
    Date.now(),
    code,
  )
}

export function resetConnectedPlayers(db: Database.Database): void {
  const rooms = db.prepare('SELECT code, state_json FROM rooms').all() as Pick<RoomRow, 'code' | 'state_json'>[]
  const update = db.prepare('UPDATE rooms SET state_json = ?, updated_at = ? WHERE code = ?')

  db.transaction(() => {
    for (const room of rooms) {
      const state = JSON.parse(room.state_json) as AnyGameState
      if (!state.players.some((player) => player.connected)) continue
      const resetState: AnyGameState = isCafeQueueState(state)
        ? { ...state, players: state.players.map((player) => ({ ...player, connected: false })) }
        : { ...state, players: state.players.map((player) => ({ ...player, connected: false })) }
      update.run(JSON.stringify(resetState), Date.now(), room.code)
    }
  })()
}
