import type { GameState } from '@town77/shared-types'
import { dealHands, pickFirstPlayer } from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function startGameHandler(io: Io, socket: Sock, db: Db) {
  return () => {
    const { playerId, roomCode } = socket.data
    if (!playerId || !roomCode) {
      socket.emit('error', { code: 'NOT_IN_ROOM', messageKey: 'errors.not_in_room' })
      return
    }

    try {
      const roomRow = getRoom(db, roomCode)
      if (!roomRow) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', messageKey: 'errors.room_not_found' })
        return
      }

      const state: GameState = JSON.parse(roomRow.state_json) as GameState

      if (state.players[0]?.id !== playerId) {
        socket.emit('error', { code: 'NOT_HOST', messageKey: 'errors.not_host' })
        return
      }
      if (state.players.length < 2) {
        socket.emit('error', { code: 'NOT_ENOUGH_PLAYERS', messageKey: 'errors.not_enough_players' })
        return
      }
      if (state.phase !== 'lobby') {
        socket.emit('error', { code: 'ALREADY_STARTED', messageKey: 'errors.already_started' })
        return
      }

      const { hands, remainingBag } = dealHands(state.bag, state.players.length, state.config.handSize)
      const firstPlayerIndex = pickFirstPlayer(state.seed, state.players.length)

      const updatedState: GameState = {
        ...state,
        bag: remainingBag,
        players: state.players.map((p, i) => ({ ...p, hand: hands[i] ?? [] })),
        turnIndex: firstPlayerIndex,
        phase: 'playing',
      }

      updateRoomState(db, roomCode, updatedState)
      logger.info({ roomCode, firstPlayerIndex }, 'game.started')
      io.to(roomCode).emit('state_update', { state: updatedState })
    } catch (err) {
      logger.error(
        { roomCode, playerId, error: (err as Error).message },
        'start_game.failed',
      )
      socket.emit('error', { code: 'INTERNAL_ERROR', messageKey: 'errors.internal' })
    }
  }
}
