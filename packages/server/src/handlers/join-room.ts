import type { JoinRoomPayload, GameState } from '@town77/shared-types'
import { createPlayer, getPlayerByToken } from '../db/players'
import { getRoom, updateRoomState } from '../db/rooms'
import { generateSessionToken, generatePlayerId } from '../room/session'
import { validatePlayerName } from '../room/validate'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function joinRoomHandler(_io: Io, socket: Sock, db: Db) {
  return (payload: JoinRoomPayload) => {
    const { code, playerName, sessionToken } = payload

    const roomRow = getRoom(db, code)
    if (!roomRow) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', messageKey: 'errors.room_not_found' })
      return
    }

    const state: GameState = JSON.parse(roomRow.state_json) as GameState

    // --- Session recovery ---
    if (sessionToken) {
      const playerRow = getPlayerByToken(db, sessionToken)
      if (playerRow && playerRow.room_code === code) {
        const updatedPlayers = state.players.map((p) =>
          p.id === playerRow.id ? { ...p, connected: true } : p,
        )
        const updatedState: GameState = { ...state, players: updatedPlayers }
        updateRoomState(db, code, updatedState)

        socket.data = { playerId: playerRow.id, roomCode: code }
        void socket.join(code)

        logger.info({ roomCode: code, playerId: playerRow.id }, 'player.reconnected')
        socket.emit('room_joined', {
          code,
          playerId: playerRow.id,
          sessionToken,
          state: updatedState,
        })
        socket.to(code).emit('state_update', { state: updatedState })
        return
      }
    }

    // --- New player ---
    if (state.phase !== 'lobby') {
      socket.emit('error', { code: 'GAME_IN_PROGRESS', messageKey: 'errors.game_in_progress' })
      return
    }
    const max = state.config.maxPlayers ?? 5
    if (state.players.length >= max) {
      socket.emit('error', { code: 'ROOM_FULL', messageKey: 'errors.room_full' })
      return
    }

    const name = validatePlayerName(playerName)
    if (!name) {
      socket.emit('error', { code: 'VALIDATION_ERROR', messageKey: 'errors.invalid_name' })
      return
    }

    const playerId = generatePlayerId()
    const newToken = generateSessionToken()

    const updatedState: GameState = {
      ...state,
      players: [
        ...state.players,
        { id: playerId, name, hand: [], placed: 0, hasDiscarded: false, connected: true },
      ],
    }

    try {
      updateRoomState(db, code, updatedState)
      createPlayer(db, { id: playerId, roomCode: code, name, sessionToken: newToken })
    } catch (err) {
      logger.error(
        { roomCode: code, playerId, error: (err as Error).message },
        'player.join_failed',
      )
      socket.emit('error', { code: 'INTERNAL_ERROR', messageKey: 'errors.internal' })
      return
    }

    socket.data = { playerId, roomCode: code }
    void socket.join(code)

    logger.info({ roomCode: code, playerId, playerName }, 'player.joined')
    socket.emit('room_joined', { code, playerId, sessionToken: newToken, state: updatedState })
    socket.to(code).emit('state_update', { state: updatedState })
  }
}
