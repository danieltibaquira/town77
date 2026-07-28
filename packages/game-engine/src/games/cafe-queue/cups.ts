import type { CafeQueueIngredient, CafeQueueRecipe, CafeQueueState } from '@town77/shared-types'
import { CAFE_QUEUE_INGREDIENTS } from '@town77/shared-types'
import { CafeQueueRuleError } from './setup'

function count(recipe: CafeQueueRecipe, ingredient: CafeQueueIngredient): number {
  return recipe[ingredient] ?? 0
}

function add(left: CafeQueueRecipe, right: CafeQueueRecipe): CafeQueueRecipe {
  return CAFE_QUEUE_INGREDIENTS.reduce<CafeQueueRecipe>((result, ingredient) => {
    const total = count(left, ingredient) + count(right, ingredient)
    return total === 0 ? result : { ...result, [ingredient]: total }
  }, {})
}

function subtract(left: CafeQueueRecipe, right: CafeQueueRecipe): CafeQueueRecipe {
  return CAFE_QUEUE_INGREDIENTS.reduce<CafeQueueRecipe>((result, ingredient) => {
    const remaining = count(left, ingredient) - count(right, ingredient)
    if (remaining < 0) throw new CafeQueueRuleError('INGREDIENT_NOT_COLLECTED')
    return remaining === 0 ? result : { ...result, [ingredient]: remaining }
  }, {})
}

function sameRecipe(left: CafeQueueRecipe, right: CafeQueueRecipe): boolean {
  return CAFE_QUEUE_INGREDIENTS.every((ingredient) => count(left, ingredient) === count(right, ingredient))
}

export function pourIngredients(
  state: CafeQueueState,
  playerId: string,
  allocations: Array<{ cupIndex: number; ingredients: CafeQueueRecipe }>,
): CafeQueueState {
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  if (playerIndex !== state.turnIndex) throw new CafeQueueRuleError('NOT_YOUR_TURN')
  const player = state.players[playerIndex]
  if (!player) throw new CafeQueueRuleError('PLAYER_NOT_FOUND')

  const allocated = allocations.reduce<CafeQueueRecipe>((total, allocation) => add(total, allocation.ingredients), {})
  const remaining = subtract(player.collectedThisTurn, allocated)
  const cups = [...player.cups]
  for (const allocation of allocations) {
    const cup = cups[allocation.cupIndex]
    if (!cup) throw new CafeQueueRuleError('INVALID_CUP')
    cups[allocation.cupIndex] = { ingredients: add(cup.ingredients, allocation.ingredients) }
  }

  return {
    ...state,
    players: state.players.map((candidate, index) => index === playerIndex
      ? { ...candidate, cups, collectedThisTurn: remaining }
      : candidate),
  }
}

export function completeOrders(
  state: CafeQueueState,
  playerId: string,
  completions: Array<{ cupIndex: number; tabIndex: number; orderId: string }>,
): CafeQueueState {
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  if (playerIndex !== state.turnIndex) throw new CafeQueueRuleError('NOT_YOUR_TURN')
  const player = state.players[playerIndex]
  if (!player) throw new CafeQueueRuleError('PLAYER_NOT_FOUND')

  let cups = [...player.cups]
  let tabs = player.orderTabs.map((tab) => [...tab]) as typeof player.orderTabs
  let completedOrders = [...player.completedOrders]
  let supply = state.ingredientSupply
  let rushSupply = state.rushSupply
  let rushTokens = player.rushTokens

  for (const completion of completions) {
    const cup = cups[completion.cupIndex]
    const tab = tabs[completion.tabIndex]
    const order = tab?.find((candidate) => candidate.id === completion.orderId)
    if (!cup || !tab || !order) throw new CafeQueueRuleError('ORDER_NOT_AVAILABLE')
    if (!sameRecipe(cup.ingredients, order.recipe)) throw new CafeQueueRuleError('RECIPE_MISMATCH')

    supply = CAFE_QUEUE_INGREDIENTS.reduce(
      (next, ingredient) => ({ ...next, [ingredient]: next[ingredient] + count(cup.ingredients, ingredient) }),
      supply,
    )
    cups[completion.cupIndex] = { ingredients: {} }
    tabs[completion.tabIndex] = tab.filter((candidate) => candidate.id !== completion.orderId)
    completedOrders = [...completedOrders, order]
    if (order.isSpecialty && rushSupply > 0) {
      rushSupply -= 1
      rushTokens += 1
    }
  }

  return {
    ...state,
    ingredientSupply: supply,
    rushSupply,
    players: state.players.map((candidate, index) => index === playerIndex
      ? { ...candidate, cups, orderTabs: tabs, completedOrders, rushTokens }
      : candidate),
  }
}
