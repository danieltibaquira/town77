import { describe, expect, it } from 'vitest'
import type { CafeQueueState, GameState } from '@town77/shared-types'
import { DEFAULT_CAFE_QUEUE_CONFIG, DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createCafeQueueState, startCafeQueueGame } from '@town77/game-engine'
import { projectStateForPlayer } from '../state/projection'

const state: GameState = {
  grid: [[null]],
  bag: [],
  players: [
    {
      id: 'alice',
      name: 'Alice',
      hand: [{ color: 'red', shape: 'circle' }],
      placed: 2,
      hasDiscarded: false,
      connected: true,
    },
    {
      id: 'bob',
      name: 'Bob',
      hand: [{ color: 'blue', shape: 'square' }],
      placed: 3,
      hasDiscarded: true,
      connected: true,
    },
  ],
  turnIndex: 1,
  phase: 'playing',
  config: DEFAULT_GAME_CONFIG,
  themeId: 'neo',
  seed: 42,
}

describe('projectStateForPlayer', () => {
  it('keeps only the recipient hand while preserving public state', () => {
    const projected = projectStateForPlayer(state, 'alice') as GameState

    expect(projected).not.toBe(state)
    expect(projected.players[0]?.hand).toEqual(state.players[0]?.hand)
    expect(projected.players[1]?.hand).toEqual([])
    expect(projected.grid).toEqual(state.grid)
    expect(projected.turnIndex).toBe(1)
    expect(projected.players.map(({ hand: _hand, ...player }) => player)).toEqual(
      state.players.map(({ hand: _hand, ...player }) => player),
    )
    expect(state.players[1]?.hand).toHaveLength(1)
  })

  it('hides the future deck and every opponent cup in cafe queue rooms', () => {
    const cafe = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, [
      { id: 'alice', name: 'Alice' },
      { id: 'bob', name: 'Bob' },
    ], 7))
    const withPrivateState: CafeQueueState = {
      ...cafe,
      players: cafe.players.map((player) => player.id === 'bob'
        ? { ...player, cups: [{ ingredients: { milk: 2 } }, ...player.cups.slice(1)], collectedThisTurn: { tea: 1 } }
        : player),
    }

    const projected = projectStateForPlayer(withPrivateState, 'alice') as CafeQueueState

    expect(projected.orderDeck).toEqual([])
    expect(projected.players[0]?.cups).toEqual(withPrivateState.players[0]?.cups)
    expect(projected.players[1]?.cups.every((cup) => Object.keys(cup.ingredients).length === 0)).toBe(true)
    expect(projected.players[1]?.collectedThisTurn).toEqual({})
  })
})
