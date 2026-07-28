import { describe, expect, it } from 'vitest'
import { DEFAULT_CAFE_QUEUE_CONFIG } from '@town77/shared-types'
import { findCafeQueueBotAction } from '../bot'
import { applyMove, createCafeQueueState, startCafeQueueGame } from '../setup'
import { SeededRNG } from '../../../rng'

describe('Cafe Queue bot', () => {
  it('proposes a deterministic legal move for the current player', () => {
    const state = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, [
      { id: 'bot', name: 'Bot' },
      { id: 'p2', name: 'Bea' },
    ], 11))

    const first = findCafeQueueBotAction(state, 'bot', new SeededRNG(9))
    const second = findCafeQueueBotAction(state, 'bot', new SeededRNG(9))

    expect(first).toEqual(second)
    expect(first?.type).toBe('move_meeple')
    if (first?.type === 'move_meeple') {
      expect(() => applyMove(state, 'bot', first.meepleIndex, first.path, first.rushSpent)).not.toThrow()
    }
  })
})
