import type { ColorId, ShapeId } from './chip'

export interface ChipSetConfig {
  colors: ColorId[]
  shapes: ShapeId[]
  copies: number
}

export interface GridConfig {
  rows: number
  cols: number
}

export interface ScoringConfig {
  placedWeight: number
  remainingWeight: number
}

export interface ExchangeConfig {
  min: number
  max: number
}

export interface GameConfig {
  grid: GridConfig
  chips: ChipSetConfig
  handSize: number
  scoring: ScoringConfig
  exchange: ExchangeConfig
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  grid: { rows: 7, cols: 7 },
  chips: {
    colors: ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7'],
    shapes: ['cottage', 'rowhouse', 'tower', 'victorian', 'barn', 'bungalow', 'skyscraper'],
    copies: 1,
  },
  handSize: 4,
  scoring: { placedWeight: 1, remainingWeight: 1 },
  exchange: { min: 3, max: 4 },
}
