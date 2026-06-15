import type { GameState } from '@town77/shared-types'
import { getValidCells, isFirstChipOnGrid } from '@town77/game-engine'

function playerCanAct(state: GameState, playerIndex: number): boolean {
  const player = state.players[playerIndex]
  if (!player || player.hand.length === 0) return false
  if (!player.hasDiscarded) return true
  const isFirst = isFirstChipOnGrid(state.grid)
  return player.hand.some((chip) => getValidCells(state.grid, chip, isFirst).length > 0)
}

export function nextTurnIndex(state: GameState, current: number): number {
  const n = state.players.length
  for (let offset = 1; offset <= n; offset++) {
    const idx = (current + offset) % n
    if (playerCanAct(state, idx)) return idx
  }
  return (current + 1) % n
}
