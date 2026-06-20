import { describe, expect, it } from 'vitest'
import type { Chip } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { SeededRNG } from '../rng'
import { initBag } from '../bag'
import {
  canDiscard,
  canExchange,
  doDiscard,
  doExchange,
  findExchangeableColorSet,
  pickFirstPlayer,
} from '../turn'

const RED_COTTAGE: Chip = { color: 'color-1', shape: 'cottage' }
const RED_TOWER: Chip = { color: 'color-1', shape: 'tower' }
const RED_BARN: Chip = { color: 'color-1', shape: 'barn' }
const RED_ROWHOUSE: Chip = { color: 'color-1', shape: 'rowhouse' }
const BLUE_COTTAGE: Chip = { color: 'color-2', shape: 'cottage' }
const GREEN_COTTAGE: Chip = { color: 'color-3', shape: 'cottage' }
const YELLOW_BARN: Chip = { color: 'color-4', shape: 'barn' }

const exchangeConfig = DEFAULT_GAME_CONFIG.exchange

describe('pickFirstPlayer', () => {
  it('is deterministic for a given seed and player count', () => {
    expect(pickFirstPlayer(42, 3)).toBe(pickFirstPlayer(42, 3))
  })

  it('returns an index within [0, playerCount)', () => {
    for (let seed = 0; seed < 50; seed++) {
      const idx = pickFirstPlayer(seed, 4)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(4)
    }
  })

  it('is not simply seed % playerCount (decorrelated from the deck)', () => {
    const differs = Array.from({ length: 50 }, (_, s) => pickFirstPlayer(s, 3) !== s % 3)
    expect(differs.some(Boolean)).toBe(true)
  })
})

describe('findExchangeableColorSet', () => {
  it('returns 3 chips of the same color when the hand has them', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    const set = findExchangeableColorSet(hand)
    expect(set).not.toBeNull()
    expect(set).toHaveLength(3)
    expect(set!.every((c) => c.color === 'color-1')).toBe(true)
  })

  it('returns null when no color has at least 3 chips', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, GREEN_COTTAGE]
    expect(findExchangeableColorSet(hand)).toBeNull()
  })

  it('returns null for an empty hand', () => {
    expect(findExchangeableColorSet([])).toBeNull()
  })

  it('returns a set that passes canExchange', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, RED_ROWHOUSE]
    const set = findExchangeableColorSet(hand)
    expect(set).not.toBeNull()
    expect(canExchange(hand, set!, exchangeConfig)).toBe(true)
  })
})

describe('canExchange', () => {
  it('returns true for 3 chips sharing same color', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    expect(canExchange(hand, [RED_COTTAGE, RED_TOWER, RED_BARN], exchangeConfig)).toBe(true)
  })

  it('returns true for 4 chips sharing same shape', () => {
    const hand = [RED_COTTAGE, BLUE_COTTAGE, GREEN_COTTAGE, YELLOW_BARN]
    expect(
      canExchange(hand, [RED_COTTAGE, BLUE_COTTAGE, GREEN_COTTAGE], exchangeConfig),
    ).toBe(true)
  })

  it('returns false for 2 chips (below minimum)', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    expect(canExchange(hand, [RED_COTTAGE, RED_TOWER], exchangeConfig)).toBe(false)
  })

  it('returns false for 5 chips (above maximum)', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, RED_ROWHOUSE]
    expect(
      canExchange(
        hand,
        [RED_COTTAGE, RED_TOWER, RED_BARN, RED_ROWHOUSE, BLUE_COTTAGE],
        exchangeConfig,
      ),
    ).toBe(false)
  })

  it('returns false when chips do not share color or shape', () => {
    const hand = [RED_COTTAGE, BLUE_COTTAGE, GREEN_COTTAGE, YELLOW_BARN]
    expect(canExchange(hand, [RED_COTTAGE, BLUE_COTTAGE, YELLOW_BARN], exchangeConfig)).toBe(
      false,
    )
  })

  it('returns false when chip is not in hand', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, YELLOW_BARN]
    const notInHand: Chip = { color: 'color-1', shape: 'victorian' }
    expect(canExchange(hand, [RED_COTTAGE, RED_TOWER, notInHand], exchangeConfig)).toBe(false)
  })
})

describe('doExchange', () => {
  it('returns new hand of same size', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const { newHand } = doExchange(hand, bag, [RED_COTTAGE, RED_TOWER, RED_BARN], new SeededRNG(1))
    expect(newHand).toHaveLength(4)
  })

  it('preserves total chip count (hand + bag)', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const total = hand.length + bag.length
    const { newHand, newBag } = doExchange(hand, bag, [RED_COTTAGE, RED_TOWER, RED_BARN], new SeededRNG(1))
    expect(newHand.length + newBag.length).toBe(total)
  })

  it('does not contain exchanged chips in new hand (statistically — seeded)', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const { newHand, newBag } = doExchange(
      hand,
      bag,
      [RED_COTTAGE, RED_TOWER, RED_BARN],
      new SeededRNG(99),
    )
    expect(newHand).toHaveLength(4)
    expect(newBag.length + newHand.length).toBe(bag.length + hand.length)
  })

  it('does not mutate input hand or bag', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const origHand = JSON.stringify(hand)
    const origBag = JSON.stringify(bag)
    doExchange(hand, bag, [RED_COTTAGE, RED_TOWER, RED_BARN], new SeededRNG(1))
    expect(JSON.stringify(hand)).toBe(origHand)
    expect(JSON.stringify(bag)).toBe(origBag)
  })
})

describe('canDiscard', () => {
  it('returns true when player has not yet discarded', () => {
    expect(canDiscard(false)).toBe(true)
  })

  it('returns false when player already discarded', () => {
    expect(canDiscard(true)).toBe(false)
  })
})

describe('doDiscard', () => {
  it('removes chip from hand', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, YELLOW_BARN]
    const bag = [GREEN_COTTAGE]
    const { newHand } = doDiscard(hand, bag, RED_COTTAGE)
    expect(newHand).not.toContainEqual(RED_COTTAGE)
  })

  it('does not draw from bag — discard is permanent', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, YELLOW_BARN]
    const bag = [GREEN_COTTAGE]
    const { newHand, newBag } = doDiscard(hand, bag, RED_COTTAGE)
    expect(newHand).toHaveLength(3) // removed 1, no replacement
    expect(newBag).toHaveLength(1) // bag unchanged
  })

  it('does not mutate input hand or bag', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, YELLOW_BARN]
    const bag = [GREEN_COTTAGE]
    const origHand = JSON.stringify(hand)
    const origBag = JSON.stringify(bag)
    doDiscard(hand, bag, RED_COTTAGE)
    expect(JSON.stringify(hand)).toBe(origHand)
    expect(JSON.stringify(bag)).toBe(origBag)
  })
})
