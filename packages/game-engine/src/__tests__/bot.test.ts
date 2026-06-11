import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { describe, expect, it } from 'vitest'
import { SeededRNG, createGrid, dealHands, findBotAction, initBag } from '../../src'

function makeSoloState(seed = 42) {
  const rng = new SeededRNG(seed)
  const bag = initBag(DEFAULT_GAME_CONFIG.chips, rng)
  const { hands, remainingBag } = dealHands(bag, 2, DEFAULT_GAME_CONFIG.handSize)

  return {
    grid: createGrid(7, 7),
    bag: remainingBag,
    players: [
      {
        id: 'human',
        name: 'Human',
        hand: hands[0]!,
        placed: 0,
        hasDiscarded: false,
        connected: true,
      },
      { id: 'bot', name: 'Bot', hand: hands[1]!, placed: 0, hasDiscarded: false, connected: true },
    ],
    turnIndex: 0,
    phase: 'playing' as const,
    config: DEFAULT_GAME_CONFIG,
    themeId: 'town77',
    seed,
  }
}

describe('bot AI', () => {
  it('finds a valid placement on first turn', () => {
    const state = makeSoloState()
    const action = findBotAction(state, 'bot')
    expect(action).not.toBeNull()
    expect(action?.type).toBe('place')
    if (action?.type === 'place') {
      expect(action.row).toBeGreaterThanOrEqual(0)
      expect(action.row).toBeLessThan(7)
      expect(action.col).toBeGreaterThanOrEqual(0)
      expect(action.col).toBeLessThan(7)
    }
  })

  it('returns a chip that the bot actually has', () => {
    const state = makeSoloState()
    const action = findBotAction(state, 'bot')
    if (action?.type === 'place') {
      const hasChip = state.players[1]!.hand.some(
        (h) => h.color === action.chip.color && h.shape === action.chip.shape,
      )
      expect(hasChip).toBe(true)
    }
  })

  it('discards when no valid placements exist', () => {
    const state = makeSoloState()
    // Fill the board so no valid moves exist
    const grid = createGrid(7, 7)
    // Place chips in every cell
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        grid[r]![c] = { color: 'color-1', shape: 'cottage' }
      }
    }
    const noMovesState = { ...state, grid }
    const action = findBotAction(noMovesState, 'bot')
    expect(action?.type).toBe('discard')
  })
})
