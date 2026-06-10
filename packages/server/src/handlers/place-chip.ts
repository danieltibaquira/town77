import type { PlaceChipPayload, GameState } from '@town77/shared-types'
import {
  isValidPlacement,
  applyPlacement,
  isFirstChipOnGrid,
  drawChips,
  calculateScores,
  isGameOver,
} from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function placeChipHandler(io: Io, socket: Sock, db: Db) {
  return (payload: PlaceChipPayload) => {
    const { playerId, roomCode } = socket.data
    if (!playerId || !roomCode) {
      socket.emit('error', { code: 'NOT_IN_ROOM', messageKey: 'errors.not_in_room' })
      return
    }

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

    const { chip, row, col } = payload

    const chipIdx = currentPlayer.hand.findIndex(
      (h) => h.color === chip.color && h.shape === chip.shape,
    )
    if (chipIdx === -1) {
      socket.emit('error', { code: 'INVALID_PLACEMENT', messageKey: 'errors.invalid_placement' })
      return
    }

    const isFirst = isFirstChipOnGrid(state.grid)
    if (!isValidPlacement(state.grid, row, col, chip, isFirst)) {
      socket.emit('error', { code: 'INVALID_PLACEMENT', messageKey: 'errors.invalid_placement' })
      return
    }

    const newGrid = applyPlacement(state.grid, row, col, chip)
    const handWithout = [
      ...currentPlayer.hand.slice(0, chipIdx),
      ...currentPlayer.hand.slice(chipIdx + 1),
    ]

    const { drawn, remainingBag } = drawChips(state.bag, 1)
    const newHand = [...handWithout, ...drawn]

    const updatedPlayers = state.players.map((p, i) =>
      i === state.turnIndex ? { ...p, hand: newHand, placed: p.placed + 1 } : p,
    )

    const nextTurnIndex = (state.turnIndex + 1) % state.players.length

    const updatedState: GameState = {
      ...state,
      grid: newGrid,
      bag: remainingBag,
      players: updatedPlayers,
      turnIndex: nextTurnIndex,
    }

    if (isGameOver(updatedState.grid, updatedState.bag, updatedState.players)) {
      const finalState: GameState = { ...updatedState, phase: 'finished' }
      updateRoomState(db, roomCode, finalState)
      const scores = calculateScores(finalState.players, finalState.config.scoring)
      logger.info({ roomCode, scores }, 'game.over')
      io.to(roomCode).emit('game_over', { scores })
      return
    }

    updateRoomState(db, roomCode, updatedState)
    logger.info({ roomCode, playerId, row, col }, 'chip.placed')
    io.to(roomCode).emit('state_update', { state: updatedState })
  }
}
