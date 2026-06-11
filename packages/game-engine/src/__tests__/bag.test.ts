import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { describe, expect, it } from 'vitest'
import { dealHands, drawChips, initBag, shuffle } from '../bag'
import { SeededRNG } from '../rng'

describe('initBag', () => {
  it('produces correct total chip count', () => {
    const rng = new SeededRNG(1)
    const config = DEFAULT_GAME_CONFIG.chips
    const bag = initBag(config, rng)
    // 7 colors × 7 shapes × 1 copy = 49
    expect(bag).toHaveLength(49)
  })

  it('contains every color-shape combination exactly once', () => {
    const rng = new SeededRNG(1)
    const config = DEFAULT_GAME_CONFIG.chips
    const bag = initBag(config, rng)
    const keys = bag.map((c) => `${c.color}:${c.shape}`)
    expect(new Set(keys).size).toBe(49)
  })

  it('produces deterministic bag from same seed', () => {
    const bag1 = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(42))
    const bag2 = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(42))
    expect(bag1).toEqual(bag2)
  })

  it('produces different bags from different seeds', () => {
    const bag1 = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const bag2 = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(2))
    expect(bag1).not.toEqual(bag2)
  })

  it('respects copies > 1', () => {
    const config = { ...DEFAULT_GAME_CONFIG.chips, copies: 2 }
    const bag = initBag(config, new SeededRNG(1))
    expect(bag).toHaveLength(98) // 7 × 7 × 2
  })
})

describe('dealHands', () => {
  it('deals correct number of chips per player', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const { hands } = dealHands(bag, 3, 4)
    expect(hands).toHaveLength(3)
    hands.forEach((h) => expect(h).toHaveLength(4))
  })

  it('removes dealt chips from remaining bag', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const { remainingBag } = dealHands(bag, 3, 4)
    expect(remainingBag).toHaveLength(49 - 12) // 49 - 3×4
  })

  it('does not mutate the input bag', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const original = [...bag]
    dealHands(bag, 2, 4)
    expect(bag).toEqual(original)
  })
})

describe('drawChips', () => {
  it('draws requested count from front of bag', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const { drawn, remainingBag } = drawChips(bag, 2)
    expect(drawn).toHaveLength(2)
    expect(remainingBag).toHaveLength(47)
  })

  it('draws all remaining when count exceeds bag size', () => {
    const bag = [{ color: 'color-1', shape: 'cottage' }]
    const { drawn, remainingBag } = drawChips(bag, 5)
    expect(drawn).toHaveLength(1)
    expect(remainingBag).toHaveLength(0)
  })

  it('does not mutate input bag', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const original = [...bag]
    drawChips(bag, 3)
    expect(bag).toEqual(original)
  })
})
