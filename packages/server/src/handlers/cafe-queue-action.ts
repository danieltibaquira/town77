import type { AnyGameState, CafeQueueAction, CafeQueueState } from '@town77/shared-types'
import { isCafeQueueState } from '@town77/shared-types'
import {
  activateUpgrade,
  applyMove,
  calculateCafeQueueScores,
  CafeQueueRuleError,
  completeOrders,
  emptyCup,
  endCafeQueueTurn,
  pourIngredients,
} from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { runInTransaction } from '../db/transactions'
import { logger } from '../logger'
import { emitStateToRoom } from '../state/broadcast'
import type { Db, Io, Sock } from '../app'

export function cafeQueueActionHandler(io: Io, socket: Sock, db: Db) {
  return (payload: unknown) => {
    const action = typeof payload === 'object' && payload !== null && 'action' in payload
      ? (payload as { action: unknown }).action
      : undefined
    const { playerId, roomCode } = socket.data
    if (!playerId || !roomCode) {
      socket.emit('error', { code: 'NOT_IN_ROOM', messageKey: 'errors.not_in_room' })
      return
    }
    if (!isCafeQueueAction(action)) {
      socket.emit('error', { code: 'INVALID_GAME_ACTION', messageKey: 'errors.invalid_game_action' })
      return
    }

    let updatedState: CafeQueueState
    try {
      runInTransaction(db, () => {
        const room = getRoom(db, roomCode)
        if (!room) throw new CafeQueueRuleError('ROOM_NOT_FOUND')
        const state = JSON.parse(room.state_json) as AnyGameState
        if (!isCafeQueueState(state)) throw new CafeQueueRuleError('INVALID_GAME_ACTION')
        updatedState = applyCafeQueueAction(state, playerId, action)
        updateRoomState(db, roomCode, updatedState)
      })
    } catch (err) {
      const code = err instanceof CafeQueueRuleError ? err.message : 'INTERNAL_ERROR'
      logger.warn({ roomCode, playerId, code }, 'cafe_queue.action_rejected')
      socket.emit('error', { code, messageKey: code === 'INTERNAL_ERROR' ? 'errors.internal' : 'errors.invalid_game_action' })
      return
    }

    emitStateToRoom(io, roomCode, updatedState!)
    if (updatedState!.phase === 'finished') {
      io.to(roomCode).emit('game_over', { scores: calculateCafeQueueScores(updatedState!) as never[] })
    }
  }
}

function applyCafeQueueAction(state: CafeQueueState, playerId: string, action: CafeQueueAction): CafeQueueState {
  switch (action.type) {
    case 'move_meeple':
      return applyMove(state, playerId, action.meepleIndex, action.path, action.rushSpent)
    case 'pour_ingredients':
      return pourIngredients(state, playerId, action.allocations)
    case 'empty_cup':
      return emptyCup(state, playerId, action.cupIndex)
    case 'complete_orders':
      return completeOrders(state, playerId, action.completions)
    case 'activate_upgrade':
      return activateUpgrade(state, playerId, action.upgrade)
    case 'end_turn': {
      const completedThisTurn = state.players[state.turnIndex]?.completedThisTurn
      if (completedThisTurn === undefined) throw new CafeQueueRuleError('NOT_YOUR_TURN')
      return endCafeQueueTurn(state, playerId, completedThisTurn)
    }
    default:
      throw new CafeQueueRuleError('INVALID_GAME_ACTION')
  }
}

function isCafeQueueAction(action: unknown): action is CafeQueueAction {
  if (typeof action !== 'object' || action === null || !('type' in action)) return false
  const candidate = action as { type?: unknown }
  return candidate.type === 'activate_upgrade'
    || candidate.type === 'move_meeple'
    || candidate.type === 'pour_ingredients'
    || candidate.type === 'empty_cup'
    || candidate.type === 'complete_orders'
    || candidate.type === 'end_turn'
}
