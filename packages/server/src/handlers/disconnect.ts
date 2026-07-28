import type { GameState } from '@town77/shared-types'
import { getRoom, updateRoomState } from '../db/rooms'
import { logger } from '../logger'
import { emitStateToRoom } from '../state/broadcast'
import { PresenceRegistry } from '../socket/presence'
import type { Io, Sock, Db } from '../app'

export function disconnectHandler(io: Io, socket: Sock, db: Db, presence = new PresenceRegistry()) {
  return () => {
    logger.debug({ socketId: socket.id }, 'socket.disconnect')

    const { playerId, roomCode } = socket.data
    if (!playerId || !roomCode) return
    if (presence.disconnect(playerId, socket.id) > 0) return

    try {
      const roomRow = getRoom(db, roomCode)
      if (!roomRow) return

      const state: GameState = JSON.parse(roomRow.state_json) as GameState
      const players = state.players.map((p) =>
        p.id === playerId ? { ...p, connected: false } : p,
      )
      const updatedState: GameState = { ...state, players }

      updateRoomState(db, roomCode, updatedState)
      logger.info({ roomCode, playerId }, 'player.disconnected')
      emitStateToRoom(io, roomCode, updatedState)
    } catch (err) {
      logger.error(
        { roomCode, playerId, error: (err as Error).message },
        'disconnect.failed',
      )
    }
  }
}
