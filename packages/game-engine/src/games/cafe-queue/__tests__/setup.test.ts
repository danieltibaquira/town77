import { describe, expect, it } from 'vitest'
import { DEFAULT_CAFE_QUEUE_CONFIG } from '@town77/shared-types'
import { applyMove, createCafeQueueState, startCafeQueueGame } from '../setup'

const PLAYERS = [
  { id: 'p1', name: 'Ada' },
  { id: 'p2', name: 'Bea' },
  { id: 'p3', name: 'Cam' },
]

describe('Cafe Queue setup', () => {
  it('seeds the starting player with two tab-one orders and every other player with one', () => {
    const state = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 41))

    expect(state.phase).toBe('playing')
    expect(state.players[0]?.orderTabs.map((tab) => tab.length)).toEqual([2, 1, 0, 0])
    expect(state.players[1]?.orderTabs.map((tab) => tab.length)).toEqual([1, 1, 0, 0])
    expect(state.players[2]?.orderTabs.map((tab) => tab.length)).toEqual([1, 1, 0, 0])
  })

  it('gives two-player games two meeples per player and larger games one', () => {
    const twoPlayer = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS.slice(0, 2), 8))
    const threePlayer = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 8))

    expect(twoPlayer.players.map((player) => player.meeplePositions)).toEqual([
      ['r0c0', 'r0c1'],
      ['r0c2', 'r0c3'],
    ])
    expect(threePlayer.players.map((player) => player.meeplePositions)).toEqual([
      ['r0c0'],
      ['r0c1'],
      ['r0c2'],
    ])
  })
})

describe('Cafe Queue movement', () => {
  it('collects the entered cell ingredient from finite supply', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))
    const moved = applyMove(started, 'p1', 0, ['r1c0'], 0)

    expect(moved.players[0]?.meeplePositions).toEqual(['r1c0'])
    expect(moved.players[0]?.collectedThisTurn).toEqual({ water: 1 })
    expect(moved.ingredientSupply.water).toBe(11)
  })

  it('rejects diagonal movement and an occupied final cell', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 1))

    expect(() => applyMove(started, 'p1', 0, ['r1c1'], 0)).toThrow('INVALID_PATH')
    expect(() => applyMove(started, 'p1', 0, ['r0c1'], 0)).toThrow('OCCUPIED_FINAL_CELL')
  })

  it('rejects a final cell occupied by another meeple owned by the active player', () => {
    const started = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS.slice(0, 2), 1))

    expect(() => applyMove(started, 'p1', 0, ['r0c1'], 0)).toThrow('OCCUPIED_FINAL_CELL')
  })
})
