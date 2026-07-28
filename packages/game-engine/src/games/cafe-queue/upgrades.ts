import type { CafeQueueState, CafeQueueUpgrade } from '@town77/shared-types'
import { CafeQueueRuleError } from './setup'

export function activateUpgrade(
  state: CafeQueueState,
  playerId: string,
  upgrade: CafeQueueUpgrade,
): CafeQueueState {
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  if (playerIndex !== state.turnIndex) throw new CafeQueueRuleError('NOT_YOUR_TURN')
  const player = state.players[playerIndex]
  if (!player) throw new CafeQueueRuleError('PLAYER_NOT_FOUND')
  if (player.activeUpgrades.includes(upgrade)) throw new CafeQueueRuleError('UPGRADE_ACTIVE')
  if (player.completedOrders.length < 3) throw new CafeQueueRuleError('INSUFFICIENT_COMPLETED_ORDERS')

  return {
    ...state,
    players: state.players.map((candidate, index) => index === playerIndex
      ? {
          ...candidate,
          completedOrders: candidate.completedOrders.slice(3),
          activeUpgrades: [...candidate.activeUpgrades, upgrade],
        }
      : candidate),
  }
}
