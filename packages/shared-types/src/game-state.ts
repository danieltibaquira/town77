import type { Chip } from './chip'
import type { GameConfig } from './game-config'
import type { CafeQueueState } from './cafe-queue'

export interface PlayerState {
  id: string
  name: string
  hand: Chip[]
  placed: number
  hasDiscarded: boolean
  connected: boolean
}

export type Grid = (Chip | null)[][]

export type GamePhase = 'lobby' | 'playing' | 'finished'

export interface GameState {
  grid: Grid
  bag: Chip[]
  players: PlayerState[]
  turnIndex: number
  phase: GamePhase
  config: GameConfig
  themeId: string
  seed: number
}

export type TilePlacementGameState = GameState
export type AnyGameState = TilePlacementGameState | CafeQueueState

export interface Score {
  playerId: string
  name: string
  placed: number
  remaining: number
  combined: number
}
