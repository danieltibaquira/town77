export const CAFE_QUEUE_INGREDIENTS = [
  'beans',
  'milk',
  'steam',
  'ice',
  'chocolate',
  'caramel',
  'tea',
  'water',
] as const

export type CafeQueueIngredient = (typeof CAFE_QUEUE_INGREDIENTS)[number]
export type CafeQueueRecipe = Partial<Record<CafeQueueIngredient, number>>
export type CafeQueueCellId = `r${number}c${number}`

export interface CafeQueueOrder {
  id: string
  recipe: CafeQueueRecipe
  isSpecialty: boolean
}

export type CafeQueueUpgrade =
  | 'double-occupied-cell'
  | 'diagonal-movement'
  | 'double-corner'
  | 'double-specialty-cell'

export interface CafeQueueCup {
  ingredients: CafeQueueRecipe
}

export interface CafeQueuePlayer {
  id: string
  name: string
  connected: boolean
  meeplePositions: CafeQueueCellId[]
  cups: CafeQueueCup[]
  collectedThisTurn: CafeQueueRecipe
  orderTabs: [CafeQueueOrder[], CafeQueueOrder[], CafeQueueOrder[], CafeQueueOrder[]]
  completedOrders: CafeQueueOrder[]
  completedThisTurn: number
  penaltyOrders: CafeQueueOrder[]
  activeUpgrades: CafeQueueUpgrade[]
  rushTokens: number
}

export interface CafeQueueConfig {
  gameId: 'cafe-queue'
  minPlayers: 2
  maxPlayers: 4
  rows: 4
  cols: 4
  cupsPerPlayer: 3
  normalMoveLimit: 3
  board: Record<CafeQueueCellId, CafeQueueIngredient>
  ingredientSupply: Record<CafeQueueIngredient, number>
  rushSupply: number
}

export const DEFAULT_CAFE_QUEUE_CONFIG: CafeQueueConfig = {
  gameId: 'cafe-queue',
  minPlayers: 2,
  maxPlayers: 4,
  rows: 4,
  cols: 4,
  cupsPerPlayer: 3,
  normalMoveLimit: 3,
  board: {
    r0c0: 'beans', r0c1: 'milk', r0c2: 'steam', r0c3: 'ice',
    r1c0: 'water', r1c1: 'tea', r1c2: 'chocolate', r1c3: 'caramel',
    r2c0: 'milk', r2c1: 'steam', r2c2: 'ice', r2c3: 'beans',
    r3c0: 'tea', r3c1: 'water', r3c2: 'caramel', r3c3: 'chocolate',
  },
  ingredientSupply: {
    beans: 18,
    milk: 12,
    steam: 12,
    ice: 12,
    chocolate: 12,
    caramel: 12,
    tea: 12,
    water: 12,
  },
  rushSupply: 15,
}

export type CafeQueuePhase = 'lobby' | 'playing' | 'finished'

export interface CafeQueueState {
  gameId: 'cafe-queue'
  phase: CafeQueuePhase
  config: CafeQueueConfig
  themeId: string
  seed: number
  players: CafeQueuePlayer[]
  turnIndex: number
  startingPlayerIndex: number
  closeArmed: boolean
  orderDeck: CafeQueueOrder[]
  ingredientSupply: Record<CafeQueueIngredient, number>
  rushSupply: number
}

export interface CafeQueueScore {
  playerId: string
  name: string
  completedOrders: number
  activeUpgrades: number
  penaltyOrders: number
  rushTokens: number
  rating: number
}

export type CafeQueueAction =
  | { type: 'activate_upgrade'; upgrade: CafeQueueUpgrade }
  | { type: 'move_meeple'; meepleIndex: number; path: CafeQueueCellId[]; rushSpent: number }
  | { type: 'pour_ingredients'; allocations: Array<{ cupIndex: number; ingredients: CafeQueueRecipe }> }
  | { type: 'empty_cup'; cupIndex: number }
  | { type: 'complete_orders'; completions: Array<{ cupIndex: number; tabIndex: number; orderId: string }> }
  | { type: 'end_turn' }
