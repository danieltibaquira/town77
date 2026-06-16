import type { DiscardChipPayload, GameState } from '@town77/shared-types'
import { canDiscard, doDiscard, isGameOver, calculateScores } from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { runBotTurn } from './solo-game'
import { nextTurnIndex } from './turn-utils'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function discardChipHandler(io: Io, socket: Sock, db: Db) {
  return (payload: DiscardChipPayload) => {
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

      if (!canDiscard(currentPlayer.hasDiscarded)) {
        socket.emit('error', { code: 'ALREADY_DISCARDED', messageKey: 'errors.already_discarded' })
        return
      }

      const chipInHand = currentPlayer.hand.some(
        (h) => h.color === payload.chip.color && h.shape === payload.chip.shape,
      )
      if (!chipInHand) {
        socket.emit('error', { code: 'INVALID_DISCARD', messageKey: 'errors.invalid_discard' })
        return
      }

      const { newHand, newBag } = doDiscard(currentPlayer.hand, state.bag, payload.chip)

      const updatedPlayers = state.players.map((p, i) =>
        i === state.turnIndex ? { ...p, hand: newHand, hasDiscarded: true } : p,
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
      logger.info({ roomCode, playerId }, 'chip.discarded')

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
        'discard_chip.failed',
      )
      socket.emit('error', { code: 'INTERNAL_ERROR', messageKey: 'errors.internal' })
    }
  }
}
