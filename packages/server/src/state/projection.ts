import type { GameState } from '@town77/shared-types'

export function projectStateForPlayer(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, hand: [...player.hand] } : { ...player, hand: [] },
    ),
  }
}
