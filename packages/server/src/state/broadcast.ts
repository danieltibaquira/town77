import type { AnyGameState, GameState } from '@town77/shared-types'
import type { Io } from '../app'
import { projectStateForPlayer } from './projection'

export function emitStateToRoom(
  io: Io,
  roomCode: string,
  state: AnyGameState,
  exceptSocketId?: string,
): void {
  const socketIds = io.sockets.adapter.rooms.get(roomCode)
  if (!socketIds) return

  for (const socketId of socketIds) {
    if (socketId === exceptSocketId) continue
    const socket = io.sockets.sockets.get(socketId)
    const playerId = socket?.data.playerId
    if (socket && playerId) {
      socket.emit('state_update', { state: projectStateForPlayer(state, playerId) as GameState })
    }
  }
}
