import type { CafeQueueAction, CafeQueueCellId, CafeQueueState } from '@town77/shared-types'
import type { RNG } from '../../rng'

function neighbors(cell: CafeQueueCellId, state: CafeQueueState): CafeQueueCellId[] {
  const match = /^r(\d+)c(\d+)$/.exec(cell)
  if (!match) return []
  const row = Number(match[1])
  const col = Number(match[2])
  const candidatePositions: Array<[number, number]> = [[row - 1, col], [row, col - 1], [row, col + 1], [row + 1, col]]
  return candidatePositions
    .filter(([nextRow, nextCol]) => nextRow >= 0 && nextCol >= 0 && nextRow < state.config.rows && nextCol < state.config.cols)
    .map(([nextRow, nextCol]) => `r${nextRow}c${nextCol}` as CafeQueueCellId)
}

export function findCafeQueueBotAction(
  state: CafeQueueState,
  playerId: string,
  rng: RNG,
): Extract<CafeQueueAction, { type: 'move_meeple' }> | null {
  if (state.phase !== 'playing' || state.players[state.turnIndex]?.id !== playerId) return null
  const player = state.players[state.turnIndex]!
  const occupiedCells = new Set(state.players.flatMap((candidate) => candidate.meeplePositions))
  const moves = player.meeplePositions.flatMap((position, meepleIndex) => neighbors(position, state)
    .filter((destination) => !occupiedCells.has(destination))
    .map((destination) => ({ type: 'move_meeple' as const, meepleIndex, path: [destination], rushSpent: 0 })))
  if (moves.length === 0) return null
  return moves[Math.floor(rng.nextFloat() * moves.length)]!
}
