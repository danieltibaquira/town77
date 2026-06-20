import type { Chip, ExchangeConfig } from '@town77/shared-types'
import type { RNG } from './rng'
import { SeededRNG } from './rng'
import { shuffle } from './bag'

// Golden-ratio constant — offsets the deck seed so the first-player draw uses
// an independent stream, decorrelated from the shuffle (SeededRNG(seed)).
const FIRST_PLAYER_SEED_OFFSET = 0x9e3779b9

/**
 * Pick the starting player index. Deterministic for a given seed (reproducible)
 * but drawn from a derived RNG stream rather than `seed % playerCount`, which is
 * biased, trivially predictable, and correlated with the deck shuffle.
 */
export function pickFirstPlayer(seed: number, playerCount: number): number {
  const rng = new SeededRNG(seed + FIRST_PLAYER_SEED_OFFSET)
  return Math.floor(rng.nextFloat() * playerCount)
}

export function canExchange(
  hand: Chip[],
  chips: Chip[],
  config: ExchangeConfig,
): boolean {
  if (chips.length < config.min || chips.length > config.max) return false

  const handCopy = [...hand]
  for (const chip of chips) {
    const idx = handCopy.findIndex(h => h.color === chip.color && h.shape === chip.shape)
    if (idx === -1) return false
    handCopy.splice(idx, 1)
  }

  const allSameColor = chips.every(c => c.color === chips[0]!.color)
  const allSameShape = chips.every(c => c.shape === chips[0]!.shape)
  return allSameColor || allSameShape
}

export function doExchange(
  hand: Chip[],
  bag: Chip[],
  chipsToExchange: Chip[],
  rng: RNG,
): { newHand: Chip[]; newBag: Chip[] } {
  const newHand = [...hand]
  for (const chip of chipsToExchange) {
    const idx = newHand.findIndex(h => h.color === chip.color && h.shape === chip.shape)
    if (idx === -1) throw new Error(`chip not in hand: ${chip.color}/${chip.shape}`)
    newHand.splice(idx, 1)
  }

  const newBag = shuffle([...bag, ...chipsToExchange], rng)
  const drawn = newBag.splice(0, chipsToExchange.length)
  newHand.push(...drawn)

  return { newHand, newBag }
}

/**
 * Find 3 chips in the hand that share a color, suitable for an exchange.
 * Returns null when no color has at least 3 chips.
 */
export function findExchangeableColorSet(hand: Chip[]): Chip[] | null {
  const byColor = new Map<string, Chip[]>()
  for (const chip of hand) {
    const group = byColor.get(chip.color) ?? []
    group.push(chip)
    byColor.set(chip.color, group)
  }
  for (const group of byColor.values()) {
    if (group.length >= 3) return group.slice(0, 3)
  }
  return null
}

export function canDiscard(hasDiscarded: boolean): boolean {
  return !hasDiscarded
}

export function doDiscard(
  hand: Chip[],
  bag: Chip[],
  chipToDiscard: Chip,
): { newHand: Chip[]; newBag: Chip[] } {
  const newHand = [...hand]
  const idx = newHand.findIndex(h => h.color === chipToDiscard.color && h.shape === chipToDiscard.shape)
  if (idx === -1) throw new Error(`chip not in hand: ${chipToDiscard.color}/${chipToDiscard.shape}`)
  newHand.splice(idx, 1)

  // Discard removes the chip permanently — no replacement drawn from bag
  return { newHand, newBag: [...bag] }
}
