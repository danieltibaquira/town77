import type {
  CafeQueueCellId,
  CafeQueueConfig,
  CafeQueueIngredient,
  CafeQueuePlayer,
  CafeQueueRecipe,
  CafeQueueState,
} from '@town77/shared-types'
import { CAFE_QUEUE_INGREDIENTS } from '@town77/shared-types'
import { createPlaceholderOrders } from './orders'

export class CafeQueueRuleError extends Error {
  constructor(code: string) {
    super(code)
  }
}

interface SetupPlayer {
  id: string
  name: string
}

function emptyRecipe(): CafeQueueRecipe {
  return {}
}

function emptyCups(count: number) {
  return Array.from({ length: count }, () => ({ ingredients: emptyRecipe() }))
}

function allCells(config: CafeQueueConfig): CafeQueueCellId[] {
  return Array.from({ length: config.rows * config.cols }, (_, index) => {
    const row = Math.floor(index / config.cols)
    const col = index % config.cols
    return `r${row}c${col}` as CafeQueueCellId
  })
}

function addIngredient(recipe: CafeQueueRecipe, ingredient: CafeQueueIngredient): CafeQueueRecipe {
  return { ...recipe, [ingredient]: (recipe[ingredient] ?? 0) + 1 }
}

function takeFromSupply(
  supply: Record<CafeQueueIngredient, number>,
  ingredient: CafeQueueIngredient,
): Record<CafeQueueIngredient, number> {
  const available = supply[ingredient]
  if (available <= 0) return supply
  return { ...supply, [ingredient]: available - 1 }
}

function startingPlayer(
  player: SetupPlayer,
  positions: CafeQueueCellId[],
  config: CafeQueueConfig,
  supply: Record<CafeQueueIngredient, number>,
): { player: CafeQueuePlayer; supply: Record<CafeQueueIngredient, number> } {
  let remainingSupply = supply
  let cupIngredients = emptyRecipe()
  for (const position of positions) {
    const ingredient = config.board[position]
    if (ingredient && remainingSupply[ingredient] > 0) {
      cupIngredients = addIngredient(cupIngredients, ingredient)
      remainingSupply = takeFromSupply(remainingSupply, ingredient)
    }
  }

  const cups = emptyCups(config.cupsPerPlayer)
  cups[0] = { ingredients: cupIngredients }
  return {
    player: {
      id: player.id,
      name: player.name,
      connected: true,
      meeplePositions: positions,
      cups,
      collectedThisTurn: emptyRecipe(),
      hasMovedThisTurn: false,
      orderTabs: [[], [], [], []],
      completedOrders: [],
      completedThisTurn: 0,
      penaltyOrders: [],
      activeUpgrades: [],
      rushTokens: 0,
    },
    supply: remainingSupply,
  }
}

export function createCafeQueueState(
  config: CafeQueueConfig,
  setupPlayers: SetupPlayer[],
  seed: number,
): CafeQueueState {
  if (setupPlayers.length < 1 || setupPlayers.length > config.maxPlayers) {
    throw new CafeQueueRuleError('INVALID_PLAYER_COUNT')
  }

  const cells = allCells(config)
  const meeplesPerPlayer = setupPlayers.length === 2 ? 2 : 1
  let supply = { ...config.ingredientSupply }
  const players = setupPlayers.map((player, index) => {
    const start = index * meeplesPerPlayer
    const placed = startingPlayer(player, cells.slice(start, start + meeplesPerPlayer), config, supply)
    supply = placed.supply
    return placed.player
  })

  return {
    gameId: 'cafe-queue',
    phase: 'lobby',
    config,
    themeId: 'neobrutalism',
    seed,
    players,
    turnIndex: 0,
    startingPlayerIndex: 0,
    closeArmed: false,
    orderDeck: createPlaceholderOrders(),
    ingredientSupply: supply,
    rushSupply: config.rushSupply,
  }
}

export function startCafeQueueGame(state: CafeQueueState): CafeQueueState {
  if (state.phase !== 'lobby') throw new CafeQueueRuleError('ALREADY_STARTED')
  const orderDeck = [...state.orderDeck]
  const players = state.players.map((player, index) => {
    const tabOneCount = index === state.startingPlayerIndex ? 2 : 1
    const tabOne = orderDeck.splice(0, tabOneCount)
    const tabTwo = orderDeck.splice(0, 1)
    return { ...player, orderTabs: [tabOne, tabTwo, [], []] as CafeQueuePlayer['orderTabs'] }
  })
  return { ...state, phase: 'playing', players, orderDeck }
}

function parseCell(cell: CafeQueueCellId): { row: number; col: number } {
  const match = /^r(\d+)c(\d+)$/.exec(cell)
  if (!match) throw new CafeQueueRuleError('INVALID_PATH')
  return { row: Number(match[1]), col: Number(match[2]) }
}

function isAdjacent(from: CafeQueueCellId, to: CafeQueueCellId, diagonal: boolean): boolean {
  const a = parseCell(from)
  const b = parseCell(to)
  const rowDistance = Math.abs(a.row - b.row)
  const colDistance = Math.abs(a.col - b.col)
  if (rowDistance === 0 && colDistance === 0) return false
  return diagonal ? rowDistance <= 1 && colDistance <= 1 : rowDistance + colDistance === 1
}

function isOccupiedByMeeple(state: CafeQueueState, cell: CafeQueueCellId): boolean {
  return state.players.some((player) => player.meeplePositions.includes(cell))
}

export function applyMove(
  state: CafeQueueState,
  playerId: string,
  meepleIndex: number,
  path: CafeQueueCellId[],
  rushSpent: number,
): CafeQueueState {
  if (state.phase !== 'playing') throw new CafeQueueRuleError('INVALID_PHASE')
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  if (playerIndex !== state.turnIndex) throw new CafeQueueRuleError('NOT_YOUR_TURN')
  const player = state.players[playerIndex]
  if (!player || !player.meeplePositions[meepleIndex] || path.length === 0) throw new CafeQueueRuleError('INVALID_PATH')
  if (player.hasMovedThisTurn) throw new CafeQueueRuleError('ALREADY_MOVED')
  if (path.length > state.config.normalMoveLimit + rushSpent || rushSpent > player.rushTokens || rushSpent < 0) {
    throw new CafeQueueRuleError('INVALID_PATH')
  }

  const diagonal = player.activeUpgrades.includes('diagonal-movement')
  let from = player.meeplePositions[meepleIndex]
  for (const destination of path) {
    if (!state.config.board[destination] || !isAdjacent(from, destination, diagonal)) {
      throw new CafeQueueRuleError('INVALID_PATH')
    }
    from = destination
  }
  const finalCell = path[path.length - 1]
  if (!finalCell || isOccupiedByMeeple(state, finalCell)) {
    throw new CafeQueueRuleError('OCCUPIED_FINAL_CELL')
  }

  let supply = state.ingredientSupply
  let collected = player.collectedThisTurn
  for (const cell of path) {
    const ingredient = state.config.board[cell]
    if (ingredient && supply[ingredient] > 0) {
      collected = addIngredient(collected, ingredient)
      supply = takeFromSupply(supply, ingredient)
    }
  }

  const positions = [...player.meeplePositions]
  positions[meepleIndex] = finalCell
  const players = state.players.map((candidate, index) => index === playerIndex
    ? { ...candidate, meeplePositions: positions, collectedThisTurn: collected, hasMovedThisTurn: true, rushTokens: candidate.rushTokens - rushSpent }
    : candidate)
  return { ...state, players, ingredientSupply: supply, rushSupply: state.rushSupply + rushSpent }
}

export function ingredientTotal(recipe: CafeQueueRecipe): number {
  return CAFE_QUEUE_INGREDIENTS.reduce((total, ingredient) => total + (recipe[ingredient] ?? 0), 0)
}
