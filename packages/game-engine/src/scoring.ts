import type { Chip, Grid, PlayerState, Score, ScoringConfig } from '@town77/shared-types'
import { getValidCells, isFirstChipOnGrid } from './grid'

export function calculateScores(players: PlayerState[], config: ScoringConfig): Score[] {
  return players.map((p) => ({
    playerId: p.id,
    name: p.name,
    placed: p.placed,
    remaining: p.hand.length,
    combined: p.placed * config.placedWeight - p.hand.length * config.remainingWeight,
  }))
}

export function isGameOver(grid: Grid, bag: Chip[], players: PlayerState[]): boolean {
  if (bag.length > 0) return false

  const firstChip = isFirstChipOnGrid(grid)
  for (const player of players) {
    for (const chip of player.hand) {
      if (getValidCells(grid, chip, firstChip).length > 0) return false
    }
  }

  return true
}
