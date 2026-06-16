import { describe, it, expect } from 'vitest'
import { createGrid, initBag, SeededRNG, findBotAction, dealHands } from '../../src'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'

function makeSoloState(seed = 42) {
  const rng = new SeededRNG(seed)
  const bag = initBag(DEFAULT_GAME_CONFIG.chips, rng)
  const { hands, remainingBag } = dealHands(bag, 2, DEFAULT_GAME_CONFIG.handSize)

  return {
    grid: createGrid(7, 7),
    bag: remainingBag,
    players: [
      { id: 'human', name: 'Human', hand: hands[0]!, placed: 0, hasDiscarded: false, connected: true },
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
        h => h.color === action.chip.color && h.shape === action.chip.shape,
      )
      expect(hasChip).toBe(true)
    }
  })

  function fullGridState(botHand: { color: string; shape: string }[], hasDiscarded = false) {
    const state = makeSoloState()
    const grid = createGrid(7, 7)
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        grid[r]![c] = { color: 'color-1', shape: 'cottage' }
      }
    }
    return {
      ...state,
      grid,
      players: [
        state.players[0]!,
        { ...state.players[1]!, hand: botHand, hasDiscarded },
      ],
    }
  }

  it('discards when no placement and no exchangeable color set and not yet discarded', () => {
    // No color has 3 chips -> cannot exchange; not discarded -> discard
    const hand = [
      { color: 'color-1', shape: 'cottage' },
      { color: 'color-1', shape: 'tower' },
      { color: 'color-2', shape: 'cottage' },
      { color: 'color-3', shape: 'barn' },
    ]
    const action = findBotAction(fullGridState(hand, false), 'bot')
    expect(action?.type).toBe('discard')
  })

  it('exchanges when no placement but holds 3 chips of the same color', () => {
    const hand = [
      { color: 'color-1', shape: 'cottage' },
      { color: 'color-1', shape: 'tower' },
      { color: 'color-1', shape: 'barn' },
      { color: 'color-2', shape: 'cottage' },
    ]
    // Exchange takes priority over discard even when not yet discarded
    const action = findBotAction(fullGridState(hand, false), 'bot')
    expect(action?.type).toBe('exchange')
    if (action?.type === 'exchange') {
      expect(action.chips).toHaveLength(3)
      expect(action.chips.every((c) => c.color === 'color-1')).toBe(true)
    }
  })

  it('returns null (no move / pass) when stuck and already discarded', () => {
    // No placement, no 3-same-color, already discarded -> no more moves
    const hand = [
      { color: 'color-1', shape: 'cottage' },
      { color: 'color-2', shape: 'tower' },
      { color: 'color-3', shape: 'barn' },
    ]
    const action = findBotAction(fullGridState(hand, true), 'bot')
    expect(action).toBeNull()
  })
})
