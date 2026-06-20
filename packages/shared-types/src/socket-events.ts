import type { Chip } from './chip'
import type { GameConfig } from './game-config'
import type { GameState, Score } from './game-state'

export interface CreateRoomPayload {
  config: GameConfig
  themeId: string
  playerName: string
  seed?: number
}

export interface JoinRoomPayload {
  code: string
  playerName: string
  playerId?: string
  sessionToken?: string
}

export interface PlaceChipPayload {
  chip: Chip
  row: number
  col: number
}

export interface ExchangeChipsPayload {
  chips: Chip[]
}

export interface DiscardChipPayload {
  chip: Chip
}

export interface RoomJoinedPayload {
  code: string
  playerId: string
  sessionToken: string
  state: GameState
}

export interface StateUpdatePayload {
  state: GameState
}

export interface ErrorPayload {
  code: string
  messageKey: string
}

export interface GameOverPayload {
  scores: Score[]
}

export type ServerToClientEvents = {
  room_joined: (payload: RoomJoinedPayload) => void
  state_update: (payload: StateUpdatePayload) => void
  error: (payload: ErrorPayload) => void
  game_over: (payload: GameOverPayload) => void
}

export type ClientToServerEvents = {
  create_room: (payload: CreateRoomPayload) => void
  create_solo_room: (payload: CreateRoomPayload) => void
  join_room: (payload: JoinRoomPayload) => void
  start_game: () => void
  start_solo_game: () => void
  place_chip: (payload: PlaceChipPayload) => void
  exchange_chips: (payload: ExchangeChipsPayload) => void
  discard_chip: (payload: DiscardChipPayload) => void
}
