import { describe, expect, it } from 'vitest'
import type { GameState } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
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
    const projected = projectStateForPlayer(state, 'alice')

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
})
