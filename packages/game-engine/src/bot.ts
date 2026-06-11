import type { Chip, GameState } from '@town77/shared-types'
import { getValidCells, isFirstChipOnGrid } from './grid'

export interface BotMove {
  type: 'place'
  chip: Chip
  row: number
  col: number
}

export interface BotDiscard {
  type: 'discard'
  chip: Chip
}

export type BotAction = BotMove | BotDiscard

/**
 * Find the first valid action for a bot player.
 * Simple strategy for testing: place the first valid chip found, otherwise discard the first chip.
 */
export function findBotAction(state: GameState, botPlayerId: string): BotAction | null {
  const botPlayer = state.players.find(p => p.id === botPlayerId)
  if (!botPlayer) return null

  const isFirst = isFirstChipOnGrid(state.grid)

  // Try every chip in hand and return the first valid placement
  for (const chip of botPlayer.hand) {
    const validCells = getValidCells(state.grid, chip, isFirst)
    if (validCells.length > 0) {
      const [row, col] = validCells[0]!
      return { type: 'place', chip, row, col }
    }
  }

  // No valid placement — discard the first chip
  if (botPlayer.hand.length > 0) {
    return { type: 'discard', chip: botPlayer.hand[0]! }
  }

  return null
}
