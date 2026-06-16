import type { ExchangeChipsPayload, GameState } from '@town77/shared-types'
import { canExchange, doExchange, SeededRNG, isGameOver, calculateScores } from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { runBotTurn } from './solo-game'
import { nextTurnIndex } from './turn-utils'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function exchangeChipsHandler(io: Io, socket: Sock, db: Db) {
  return (payload: ExchangeChipsPayload) => {
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

      if (state.phase !== 'playing') {
        socket.emit('error', { code: 'GAME_NOT_ACTIVE', messageKey: 'errors.game_not_active' })
        return
      }

      const currentPlayer = state.players[state.turnIndex]
      if (!currentPlayer || currentPlayer.id !== playerId) {
        socket.emit('error', { code: 'NOT_YOUR_TURN', messageKey: 'errors.not_your_turn' })
        return
      }

      if (!canExchange(currentPlayer.hand, payload.chips, state.config.exchange)) {
        socket.emit('error', { code: 'INVALID_EXCHANGE', messageKey: 'errors.invalid_exchange' })
        return
      }

      const rng = new SeededRNG(state.seed + state.turnIndex)
      const { newHand, newBag } = doExchange(currentPlayer.hand, state.bag, payload.chips, rng)

      const updatedPlayers = state.players.map((p, i) =>
        i === state.turnIndex ? { ...p, hand: newHand } : p,
      )
      const nextTurnIdx = nextTurnIndex(
        { ...state, players: updatedPlayers },
        state.turnIndex,
      )
      const updatedState: GameState = {
        ...state,
        bag: newBag,
        players: updatedPlayers,
        turnIndex: nextTurnIdx,
      }

      updateRoomState(db, roomCode, updatedState)
      logger.info({ roomCode, playerId, count: payload.chips.length }, 'chips.exchanged')

      if (isGameOver(updatedState.grid, updatedState.bag, updatedState.players)) {
        const finalState: GameState = { ...updatedState, phase: 'finished' }
        updateRoomState(db, roomCode, finalState)
        const scores = calculateScores(finalState.players, finalState.config.scoring)
        logger.info({ roomCode, scores }, 'game.over')
        io.to(roomCode).emit('game_over', { scores })
        return
      }

      io.to(roomCode).emit('state_update', { state: updatedState })

      // Trigger bot turn if next player is a bot
      const nextPlayer = updatedState.players[nextTurnIdx]
      if (nextPlayer && nextPlayer.id.startsWith('bot-')) {
        setTimeout(() => runBotTurn(io, db, roomCode, updatedState), 1000)
      }
    } catch (err) {
      logger.error(
        { roomCode, playerId, error: (err as Error).message },
        'exchange_chips.failed',
      )
      socket.emit('error', { code: 'INTERNAL_ERROR', messageKey: 'errors.internal' })
    }
  }
}
