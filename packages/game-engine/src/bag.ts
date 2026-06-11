import type { Chip, ChipSetConfig } from '@town77/shared-types'
import type { RNG } from './rng'

export function initBag(config: ChipSetConfig, rng: RNG): Chip[] {
  const chips: Chip[] = []
  for (const color of config.colors) {
    for (const shape of config.shapes) {
      for (let i = 0; i < config.copies; i++) {
        chips.push({ color, shape })
      }
    }
  }
  return shuffle(chips, rng)
}

export function shuffle<T>(arr: T[], rng: RNG): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.nextFloat() * (i + 1))
    const tmp = result[i]!
    result[i] = result[j]!
    result[j] = tmp
  }
  return result
}

export function dealHands(
  bag: Chip[],
  playerCount: number,
  handSize: number,
): { hands: Chip[][]; remainingBag: Chip[] } {
  const remaining = [...bag]
  const hands: Chip[][] = []
  for (let i = 0; i < playerCount; i++) {
    hands.push(remaining.splice(0, handSize))
  }
  return { hands, remainingBag: remaining }
}

export function drawChips(bag: Chip[], count: number): { drawn: Chip[]; remainingBag: Chip[] } {
  const remaining = [...bag]
  const drawn = remaining.splice(0, count)
  return { drawn, remainingBag: remaining }
}
