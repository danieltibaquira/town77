import { describe, expect, it } from 'vitest'
import { DEFAULT_CAFE_QUEUE_CONFIG } from '@town77/shared-types'
import { createPlaceholderOrders } from '../orders'
import { completeOrders, pourIngredients } from '../cups'
import { activateUpgrade } from '../upgrades'
import { applyMove, createCafeQueueState, startCafeQueueGame } from '../setup'

const PLAYERS = [
  { id: 'p1', name: 'Ada' },
  { id: 'p2', name: 'Bea' },
  { id: 'p3', name: 'Cam' },
]

describe('Cafe Queue cups and orders', () => {
  it('pours newly collected ingredients and completes an exact matching order', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const moved = applyMove(started, 'p1', 0, ['r1c0'], 0)
    const poured = pourIngredients(moved, 'p1', [{ cupIndex: 0, ingredients: { water: 1 } }])
    const completed = completeOrders(poured, 'p1', [{ cupIndex: 0, tabIndex: 0, orderId: 'cafe-queue-01' }])

    expect(completed.players[0]?.cups[0]?.ingredients).toEqual({})
    expect(completed.players[0]?.completedOrders.map((order) => order.id)).toEqual(['cafe-queue-01'])
    expect(completed.players[0]?.orderTabs[0].map((order) => order.id)).not.toContain('cafe-queue-01')
    expect(completed.ingredientSupply.beans).toBe(18)
    expect(completed.ingredientSupply.water).toBe(12)
  })

  it('rejects an order when the cup has extra ingredients', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const moved = applyMove(started, 'p1', 0, ['r1c0'], 0)
    const poured = pourIngredients(moved, 'p1', [{ cupIndex: 0, ingredients: { water: 1 } }])
    const withExtra = { ...poured, players: poured.players.map((player) => player.id === 'p1'
      ? { ...player, cups: [{ ingredients: { beans: 1, water: 1, milk: 1 } }, ...player.cups.slice(1)] }
      : player) }

    expect(() => completeOrders(withExtra, 'p1', [{ cupIndex: 0, tabIndex: 0, orderId: 'cafe-queue-01' }])).toThrow('RECIPE_MISMATCH')
  })
})

describe('Cafe Queue upgrades', () => {
  it('spends exactly three completed orders to activate one permanent upgrade', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const orders = createPlaceholderOrders()
    const ready = { ...started, players: started.players.map((player) => player.id === 'p1'
      ? { ...player, completedOrders: orders.slice(0, 3) }
      : player) }
    const upgraded = activateUpgrade(ready, 'p1', 'diagonal-movement')

    expect(upgraded.players[0]?.completedOrders).toEqual([])
    expect(upgraded.players[0]?.activeUpgrades).toEqual(['diagonal-movement'])
  })
})
