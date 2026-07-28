import type { CafeQueueScore, CafeQueueState } from '@town77/shared-types'

export function calculateCafeQueueScores(state: CafeQueueState): CafeQueueScore[] {
  return state.players
    .map((player, index) => ({
      playerId: player.id,
      name: player.name,
      completedOrders: player.completedOrders.length,
      activeUpgrades: player.activeUpgrades.length,
      penaltyOrders: player.penaltyOrders.length,
      rushTokens: player.rushTokens,
      rating: player.completedOrders.length + (2 * player.activeUpgrades.length) - player.penaltyOrders.length,
      index,
    }))
    .sort((left, right) => right.rating - left.rating
      || right.completedOrders - left.completedOrders
      || right.rushTokens - left.rushTokens
      || left.index - right.index)
    .map(({ index: _index, ...score }) => score)
}

export function isCafeQueueGameOver(state: CafeQueueState): boolean {
  return state.phase === 'finished'
}
