import type Database from 'better-sqlite3'
import type { GameState } from '@town77/shared-types'

const LOBBY_RETENTION_MS = 24 * 60 * 60 * 1000
const FINISHED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

export function deleteExpiredRooms(db: Database.Database, now = Date.now()): number {
  const rooms = db.prepare('SELECT code, state_json, updated_at FROM rooms').all() as Array<{
    code: string
    state_json: string
    updated_at: number
  }>
  const expiredCodes = rooms.flatMap((room) => {
    const state = JSON.parse(room.state_json) as GameState
    const oldLobby = state.phase === 'lobby' && state.players.every((player) => !player.connected) && now - room.updated_at > LOBBY_RETENTION_MS
    const oldFinished = state.phase === 'finished' && now - room.updated_at > FINISHED_RETENTION_MS
    return oldLobby || oldFinished ? [room.code] : []
  })
  if (expiredCodes.length === 0) return 0

  const deletePlayers = db.prepare('DELETE FROM players WHERE room_code = ?')
  const deleteRoom = db.prepare('DELETE FROM rooms WHERE code = ?')
  db.transaction(() => {
    for (const code of expiredCodes) {
      deletePlayers.run(code)
      deleteRoom.run(code)
    }
  })()
  return expiredCodes.length
}
