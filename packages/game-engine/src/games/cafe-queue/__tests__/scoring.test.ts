import { describe, expect, it } from 'vitest'
import { DEFAULT_CAFE_QUEUE_CONFIG, type CafeQueueState } from '@town77/shared-types'
import { createPlaceholderOrders } from '../orders'
import { calculateCafeQueueScores } from '../scoring'
import { createCafeQueueState, startCafeQueueGame } from '../setup'

const PLAYERS = [{ id: 'p1', name: 'Ada' }, { id: 'p2', name: 'Bea' }]

describe('Cafe Queue scoring', () => {
  it('ranks rating, then completed orders, then rush tokens', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const orders = createPlaceholderOrders()
    const state = {
      ...started,
      players: [
        { ...started.players[0]!, completedOrders: orders.slice(0, 4), activeUpgrades: ['diagonal-movement'], penaltyOrders: [orders[4]!], rushTokens: 1 },
        { ...started.players[1]!, completedOrders: orders.slice(0, 2), activeUpgrades: ['double-corner', 'diagonal-movement'], penaltyOrders: [orders[5]!], rushTokens: 3 },
      ],
    } as CafeQueueState

    expect(calculateCafeQueueScores(state).map((score) => score.playerId)).toEqual(['p1', 'p2'])
    expect(calculateCafeQueueScores(state)[0]?.rating).toBe(5)
  })

  it('keeps a shared win when every score tie-break is equal', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const orders = createPlaceholderOrders()
    const state = {
      ...started,
      players: started.players.map((player) => ({
        ...player,
        completedOrders: orders.slice(0, 2),
        rushTokens: 1,
      })),
    } as CafeQueueState

    expect(calculateCafeQueueScores(state).map((score) => score.playerId)).toEqual(['p1', 'p2'])
  })
})
