import type { CafeQueueIngredient, CafeQueuePlayer, CafeQueueRecipe, CafeQueueState } from '@town77/shared-types'
import { CAFE_QUEUE_INGREDIENTS } from '@town77/shared-types'
import { CafeQueueRuleError } from './setup'

function returnIngredients(
  supply: Record<CafeQueueIngredient, number>,
  ingredients: CafeQueueRecipe,
): Record<CafeQueueIngredient, number> {
  return CAFE_QUEUE_INGREDIENTS.reduce(
    (next, ingredient) => ({ ...next, [ingredient]: next[ingredient] + (ingredients[ingredient] ?? 0) }),
    supply,
  )
}

function overloadTargets(playerCount: number, currentIndex: number): number[] {
  const left = (currentIndex + 1) % playerCount
  if (playerCount === 2) return [left, left]
  return [left, (currentIndex + 2) % playerCount]
}

function addOverloadOrders(
  state: CafeQueueState,
  completedThisTurn: number,
): Pick<CafeQueueState, 'players' | 'orderDeck'> {
  const tabs = state.players.map((player) => player.orderTabs.map((tab) => [...tab]) as CafeQueuePlayer['orderTabs'])
  const orderDeck = [...state.orderDeck]
  const targets = overloadTargets(state.players.length, state.turnIndex)
  for (let completion = 0; completion < completedThisTurn; completion += 1) {
    for (const target of targets) {
      const order = orderDeck.shift()
      if (!order) return {
        players: state.players.map((player, index) => ({ ...player, orderTabs: tabs[index]! })),
        orderDeck,
      }
      tabs[target]![0].push(order)
    }
  }
  return {
    players: state.players.map((player, index) => ({ ...player, orderTabs: tabs[index]! })),
    orderDeck,
  }
}

function ageOrders(players: CafeQueuePlayer[], rushSupply: number): Pick<CafeQueueState, 'players' | 'rushSupply'> {
  let remainingRush = rushSupply
  const agedPlayers = players.map((player) => {
    const departing = player.orderTabs[3]
    const bonusRush = Math.min(departing.length, remainingRush)
    remainingRush -= bonusRush
    return {
      ...player,
      orderTabs: [[], player.orderTabs[0], player.orderTabs[1], player.orderTabs[2]] as CafeQueuePlayer['orderTabs'],
      penaltyOrders: [...player.penaltyOrders, ...departing],
      rushTokens: player.rushTokens + bonusRush,
    }
  })
  return { players: agedPlayers, rushSupply: remainingRush }
}

export function endCafeQueueTurn(
  state: CafeQueueState,
  playerId: string,
  completedThisTurn: number,
): CafeQueueState {
  if (state.phase !== 'playing') throw new CafeQueueRuleError('INVALID_PHASE')
  if (!Number.isInteger(completedThisTurn) || completedThisTurn < 0) throw new CafeQueueRuleError('INVALID_COMPLETION_COUNT')
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  if (playerIndex !== state.turnIndex) throw new CafeQueueRuleError('NOT_YOUR_TURN')

  const wasCloseArmed = state.closeArmed
  const overloaded = addOverloadOrders(state, completedThisTurn)
  const endedPlayer = overloaded.players[playerIndex]!
  const ingredientSupply = returnIngredients(state.ingredientSupply, endedPlayer.collectedThisTurn)
  const withReturnedCollection = overloaded.players.map((player, index) => index === playerIndex
    ? { ...player, collectedThisTurn: {} }
    : player)
  const aged = ageOrders(withReturnedCollection, state.rushSupply)
  const closeArmed = wasCloseArmed
    || overloaded.orderDeck.length === 0
    || aged.players.some((player) => player.penaltyOrders.length >= 5)
  const turnIndex = (state.turnIndex + 1) % state.players.length
  const phase = wasCloseArmed && playerIndex === state.startingPlayerIndex ? 'finished' : 'playing'

  return {
    ...state,
    phase,
    turnIndex,
    closeArmed,
    orderDeck: overloaded.orderDeck,
    ingredientSupply,
    players: aged.players,
    rushSupply: aged.rushSupply,
  }
}
