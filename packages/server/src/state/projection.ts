import type { AnyGameState } from '@town77/shared-types'
import { isCafeQueueState } from '@town77/shared-types'

export function projectStateForPlayer(state: AnyGameState, playerId: string): AnyGameState {
  if (isCafeQueueState(state)) {
    return {
      ...state,
      orderDeck: [],
      players: state.players.map((player) => player.id === playerId
        ? { ...player, cups: player.cups.map((cup) => ({ ingredients: { ...cup.ingredients } })), collectedThisTurn: { ...player.collectedThisTurn } }
        : { ...player, cups: player.cups.map(() => ({ ingredients: {} })), collectedThisTurn: {} }),
    }
  }
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, hand: [...player.hand] } : { ...player, hand: [] },
    ),
  }
}
