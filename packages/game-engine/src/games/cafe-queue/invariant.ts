import type { CafeQueueState } from '@town77/shared-types'
import { CAFE_QUEUE_INGREDIENTS } from '@town77/shared-types'
import { CafeQueueRuleError } from './setup'

export function assertCafeQueueInvariant(state: CafeQueueState): void {
  if (state.players.length < state.config.minPlayers || state.players.length > state.config.maxPlayers) {
    throw new CafeQueueRuleError('INVALID_PLAYER_COUNT')
  }
  if (CAFE_QUEUE_INGREDIENTS.some((ingredient) => state.ingredientSupply[ingredient] < 0)) {
    throw new CafeQueueRuleError('NEGATIVE_INGREDIENT_SUPPLY')
  }
  if (state.rushSupply < 0 || state.rushSupply + state.players.reduce((total, player) => total + player.rushTokens, 0) !== state.config.rushSupply) {
    throw new CafeQueueRuleError('INVALID_RUSH_CONSERVATION')
  }

  const orderIds = [
    ...state.orderDeck.map((order) => order.id),
    ...state.players.flatMap((player) => player.orderTabs.flatMap((tab) => tab.map((order) => order.id))),
  ]
  if (new Set(orderIds).size !== orderIds.length) throw new CafeQueueRuleError('DUPLICATE_LIVE_ORDER')

  const meeplePositions = state.players.flatMap((player) => player.meeplePositions)
  if (new Set(meeplePositions).size !== meeplePositions.length) throw new CafeQueueRuleError('DUPLICATE_MEEPLE_POSITION')
  if (state.players.some((player) => player.orderTabs.length !== 4)) throw new CafeQueueRuleError('INVALID_ORDER_TABS')
}
