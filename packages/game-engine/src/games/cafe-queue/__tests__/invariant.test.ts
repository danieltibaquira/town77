import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { DEFAULT_CAFE_QUEUE_CONFIG } from '@town77/shared-types'
import { findCafeQueueBotAction } from '../bot'
import { assertCafeQueueInvariant } from '../invariant'
import { applyMove, createCafeQueueState, startCafeQueueGame } from '../setup'
import { endCafeQueueTurn } from '../turn'
import { SeededRNG } from '../../../rng'

describe('Cafe Queue invariant', () => {
  it('accepts a started state and rejects duplicate live orders', () => {
    const state = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, [
      { id: 'p1', name: 'Ada' },
      { id: 'p2', name: 'Bea' },
    ], 1))

    expect(() => assertCafeQueueInvariant(state)).not.toThrow()
    const duplicate = { ...state, orderDeck: [state.players[0]!.orderTabs[0][0]!, ...state.orderDeck] }
    expect(() => assertCafeQueueInvariant(duplicate)).toThrow('DUPLICATE_LIVE_ORDER')
  })

  it('preserves the invariant through seeded bot moves and turn ends', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 50 }), (seed) => {
      let state = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, [
        { id: 'p1', name: 'Ada' },
        { id: 'p2', name: 'Bea' },
      ], seed))
      const rng = new SeededRNG(seed)
      for (let turn = 0; turn < 8; turn += 1) {
        const playerId = state.players[state.turnIndex]!.id
        const action = findCafeQueueBotAction(state, playerId, rng)
        if (action) state = applyMove(state, playerId, action.meepleIndex, action.path, action.rushSpent)
        assertCafeQueueInvariant(state)
        state = endCafeQueueTurn(state, playerId, 0)
        assertCafeQueueInvariant(state)
      }
    }))
  })
})
