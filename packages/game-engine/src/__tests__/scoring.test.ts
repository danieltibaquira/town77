import { describe, expect, it } from 'vitest'
import type { PlayerState, Grid } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { applyPlacement, createGrid } from '../grid'
import { calculateScores, isGameOver } from '../scoring'

const RED_COTTAGE = { color: 'color-1', shape: 'cottage' }
const BLUE_TOWER = { color: 'color-2', shape: 'tower' }
const GREEN_BARN = { color: 'color-3', shape: 'barn' }
// Shares color with RED_COTTAGE — a legal same-color line partner
const RED_TOWER = { color: 'color-1', shape: 'tower' }

function makePlayer(
  overrides: Partial<PlayerState> = {},
): PlayerState {
  return {
    id: 'p1',
    name: 'Alice',
    hand: [],
    placed: 0,
    hasDiscarded: false,
    connected: true,
    ...overrides,
  }
}

describe('calculateScores', () => {
  it('calculates correct combined score', () => {
    const players = [
      makePlayer({ id: 'p1', name: 'Alice', placed: 10, hand: [RED_COTTAGE, BLUE_TOWER] }),
      makePlayer({ id: 'p2', name: 'Bob', placed: 8, hand: [GREEN_BARN] }),
    ]
    const scores = calculateScores(players, DEFAULT_GAME_CONFIG.scoring)
    // combined = placed × 1 - remaining × 1
    expect(scores[0]!.combined).toBe(10 - 2) // 8
    expect(scores[1]!.combined).toBe(8 - 1)  // 7
  })

  it('scores are always deterministic given same input', () => {
    const players = [makePlayer({ placed: 5, hand: [RED_COTTAGE] })]
    expect(calculateScores(players, DEFAULT_GAME_CONFIG.scoring)).toEqual(
      calculateScores(players, DEFAULT_GAME_CONFIG.scoring),
    )
  })

  it('respects configurable weights', () => {
    const players = [makePlayer({ placed: 6, hand: [RED_COTTAGE, BLUE_TOWER] })]
    const scores = calculateScores(players, { placedWeight: 2, remainingWeight: 3 })
    expect(scores[0]!.combined).toBe(6 * 2 - 2 * 3) // 6
  })

  it('returns one score per player', () => {
    const players = [makePlayer({ id: 'p1' }), makePlayer({ id: 'p2' })]
    expect(calculateScores(players, DEFAULT_GAME_CONFIG.scoring)).toHaveLength(2)
  })
})

describe('isGameOver', () => {
  it('returns false when bag still has chips', () => {
    const grid = createGrid(7, 7)
    const players = [makePlayer({ hand: [RED_COTTAGE] })]
    expect(isGameOver(grid, [BLUE_TOWER], players)).toBe(false)
  })

  it('returns true when bag empty and no valid placements', () => {
    // Fill entire grid (force no valid placements)
    let grid: Grid = createGrid(7, 7)
    const colors = ['color-1','color-2','color-3','color-4','color-5','color-6','color-7']
    const shapes = ['cottage','rowhouse','tower','victorian','barn','bungalow','skyscraper']
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        grid = applyPlacement(grid, r, c, { color: colors[r]!, shape: shapes[c]! })
      }
    }
    const players = [makePlayer({ hand: [RED_COTTAGE] })]
    expect(isGameOver(grid, [], players)).toBe(true)
  })

  it('returns false when bag empty but valid placements still exist', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, RED_COTTAGE)
    const players = [makePlayer({ hand: [RED_TOWER] })]
    // RED_TOWER forms a legal same-color line adjacent to RED_COTTAGE
    expect(isGameOver(grid, [], players)).toBe(false)
  })
})
