import { describe, expect, it } from 'vitest'
import { DEFAULT_CAFE_QUEUE_CONFIG, type CafeQueueState } from '@town77/shared-types'
import { createPlaceholderOrders } from '../orders'
import { endCafeQueueTurn } from '../turn'
import { createCafeQueueState, startCafeQueueGame } from '../setup'

const PLAYERS = [{ id: 'p1', name: 'Ada' }, { id: 'p2', name: 'Bea' }, { id: 'p3', name: 'Cam' }]

describe('Cafe Queue turn end', () => {
  it('ages tab-four orders into penalties and returns the next player', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const orders = createPlaceholderOrders()
    const state = {
      ...started,
      players: started.players.map((player, index) => index === 0
        ? { ...player, orderTabs: [[], [], [], [orders[0]!]] }
        : player),
    } as CafeQueueState
    const ended = endCafeQueueTurn(state, 'p1', 0)

    expect(ended.players[0]?.penaltyOrders.map((order) => order.id)).toEqual(['cafe-queue-01'])
    expect(ended.players[0]?.rushTokens).toBe(1)
    expect(ended.turnIndex).toBe(1)
  })

  it('adds completed-order overload to the two players on the left in order', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const state = { ...started, players: started.players.map((player, index) => index === 0 ? { ...player, completedThisTurn: 1 } : player) }
    const ended = endCafeQueueTurn(state, 'p1', 1)

    expect(ended.players[1]?.orderTabs.map((tab) => tab.length)).toEqual([0, 2, 1, 0])
    expect(ended.players[2]?.orderTabs.map((tab) => tab.length)).toEqual([0, 2, 1, 0])
  })

  it('gives the other player two overload orders in a two-player game', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS.slice(0, 2), 1))
    const state = { ...started, players: started.players.map((player, index) => index === 0 ? { ...player, completedThisTurn: 1 } : player) }
    const ended = endCafeQueueTurn(state, 'p1', 1)

    expect(ended.players[1]?.orderTabs.map((tab) => tab.length)).toEqual([0, 3, 1, 0])
  })

  it('arms closing when a partial overload exhausts the deck', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const state = { ...started, orderDeck: [createPlaceholderOrders()[0]!], players: started.players.map((player, index) => index === 0 ? { ...player, completedThisTurn: 1 } : player) }
    const ended = endCafeQueueTurn(state, 'p1', 1)

    expect(ended.orderDeck).toEqual([])
    expect(ended.closeArmed).toBe(true)
  })

  it('rejects a completion count that does not match the authoritative turn state', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))

    expect(() => endCafeQueueTurn(started, 'p1', 1)).toThrow('INVALID_COMPLETION_COUNT')
  })

  it('arms after a fifth penalty and finishes only at the starting-player boundary', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const orders = createPlaceholderOrders()
    const state = {
      ...started,
      turnIndex: 2,
      players: started.players.map((player, index) => index === 2
        ? { ...player, orderTabs: [[], [], [], [orders[0]!]], penaltyOrders: orders.slice(1, 5) }
        : player),
    } as CafeQueueState

    const armed = endCafeQueueTurn(state, 'p3', 0)
    expect(armed.phase).toBe('playing')
    expect(armed.closeArmed).toBe(true)
    expect(armed.turnIndex).toBe(0)

    const finished = endCafeQueueTurn(armed, 'p1', 0)
    expect(finished.phase).toBe('finished')
  })

  it('finishes a deterministic game after the armed final round', () => {
    let state = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 73))
    state = { ...state, orderDeck: [] }
    state = endCafeQueueTurn(state, 'p1', 0)
    state = endCafeQueueTurn(state, 'p2', 0)
    state = endCafeQueueTurn(state, 'p3', 0)
    state = endCafeQueueTurn(state, 'p1', 0)

    expect(state.phase).toBe('finished')
    expect(state.turnIndex).toBe(1)
  })
})
