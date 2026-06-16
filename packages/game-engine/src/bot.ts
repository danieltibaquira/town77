import type { Chip, GameState } from '@town77/shared-types'
import { getValidCells, isFirstChipOnGrid } from './grid'
import { findExchangeableColorSet } from './turn'

export interface BotMove {
  type: 'place'
  chip: Chip
  row: number
  col: number
}

export interface BotExchange {
  type: 'exchange'
  chips: Chip[]
}

export interface BotDiscard {
  type: 'discard'
  chip: Chip
}

export type BotAction = BotMove | BotExchange | BotDiscard

/**
 * Find the next action for a bot player. Decision ladder:
 *   1. place the first chip with a valid placement
 *   2. otherwise exchange, but only when holding 3 chips of the same color
 *   3. otherwise discard one chip, if it has not discarded yet
 *   4. otherwise no move is possible (turn is passed) — returns null
 */
export function findBotAction(state: GameState, botPlayerId: string): BotAction | null {
  const botPlayer = state.players.find(p => p.id === botPlayerId)
  if (!botPlayer) return null

  const isFirst = isFirstChipOnGrid(state.grid)

  // 1. Try every chip in hand and return the first valid placement
  for (const chip of botPlayer.hand) {
    const validCells = getValidCells(state.grid, chip, isFirst)
    if (validCells.length > 0) {
      const [row, col] = validCells[0]!
      return { type: 'place', chip, row, col }
    }
  }

  // 2. No valid placement — exchange if holding 3 chips of the same color
  const exchangeSet = findExchangeableColorSet(botPlayer.hand)
  if (exchangeSet) {
    return { type: 'exchange', chips: exchangeSet }
  }

  // 3. Discard the first chip, if not already discarded this game
  if (!botPlayer.hasDiscarded && botPlayer.hand.length > 0) {
    return { type: 'discard', chip: botPlayer.hand[0]! }
  }

  // 4. No move possible — the turn is passed
  return null
}
