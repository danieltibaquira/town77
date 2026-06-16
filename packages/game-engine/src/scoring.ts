import type { Chip, Grid, PlayerState, Score, ScoringConfig } from '@town77/shared-types'
import { getValidCells, isFirstChipOnGrid } from './grid'
import { findExchangeableColorSet } from './turn'

export function calculateScores(players: PlayerState[], config: ScoringConfig): Score[] {
  return players.map(p => ({
    playerId: p.id,
    name: p.name,
    placed: p.placed,
    remaining: p.hand.length,
    combined: p.placed * config.placedWeight - p.hand.length * config.remainingWeight,
  }))
}

/**
 * A player can still progress the game when they can place a chip, can
 * exchange (3 chips of the same color), or have not used their one discard.
 * A player whose only option is to pass cannot progress.
 */
function playerCanProgress(grid: Grid, player: PlayerState): boolean {
  if (player.hand.length === 0) return false
  if (!player.hasDiscarded) return true

  const firstChip = isFirstChipOnGrid(grid)
  if (player.hand.some(chip => getValidCells(grid, chip, firstChip).length > 0)) return true

  return findExchangeableColorSet(player.hand) !== null
}

export function isGameOver(grid: Grid, bag: Chip[], players: PlayerState[]): boolean {
  // Bag empty: the game ends once no chip on any hand can be placed (a discard
  // or exchange draws nothing useful from an empty bag).
  if (bag.length === 0) {
    const firstChip = isFirstChipOnGrid(grid)
    for (const player of players) {
      for (const chip of player.hand) {
        if (getValidCells(grid, chip, firstChip).length > 0) return false
      }
    }
    return true
  }

  // Bag not empty: the game also ends when every player is stuck — none can
  // place, exchange, or discard — so they would all only pass (deadlock).
  return players.every(player => !playerCanProgress(grid, player))
}
