import { createGrid } from '@town77/game-engine'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import type { GameState } from '@town77/shared-types'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../store/gameStore'

function makeGameState(phase: GameState['phase'] = 'lobby'): GameState {
  return {
    grid: createGrid(7, 7),
    bag: [],
    players: [
      { id: 'p1', name: 'Alice', hand: [], placed: 0, hasDiscarded: false, connected: true },
    ],
    turnIndex: 0,
    phase,
    config: DEFAULT_GAME_CONFIG,
    themeId: 'town77',
    seed: 42,
  }
}

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().disconnect()
    useGameStore.setState({
      gameState: null,
      playerId: null,
      sessionToken: null,
      roomCode: null,
      selectedChip: null,
      lastError: null,
      connected: false,
    })
    localStorage.clear()
  })

  it('has correct initial state', () => {
    const { connected, gameState, playerId, roomCode } = useGameStore.getState()
    expect(gameState).toBeNull()
    expect(playerId).toBeNull()
    expect(roomCode).toBeNull()
    expect(connected).toBe(false)
  })

  it('setGameState updates gameState', () => {
    const state = makeGameState()
    useGameStore.getState().setGameState(state)
    expect(useGameStore.getState().gameState).toEqual(state)
  })

  it('setSession sets playerId, sessionToken, roomCode', () => {
    useGameStore.getState().setSession({ playerId: 'p1', sessionToken: 'tok', roomCode: 'ABC123' })
    const { playerId, roomCode, sessionToken } = useGameStore.getState()
    expect(playerId).toBe('p1')
    expect(sessionToken).toBe('tok')
    expect(roomCode).toBe('ABC123')
  })

  it('selectChip sets selectedChip', () => {
    const chip = { color: 'color-1', shape: 'cottage' }
    useGameStore.getState().selectChip(chip)
    expect(useGameStore.getState().selectedChip).toEqual(chip)
  })

  it('selectChip with null deselects', () => {
    useGameStore.getState().selectChip({ color: 'color-1', shape: 'cottage' })
    useGameStore.getState().selectChip(null)
    expect(useGameStore.getState().selectedChip).toBeNull()
  })

  it('setError sets lastError', () => {
    useGameStore
      .getState()
      .setError({ code: 'INVALID_PLACEMENT', messageKey: 'errors.invalid_placement' })
    expect(useGameStore.getState().lastError?.code).toBe('INVALID_PLACEMENT')
  })

  it('clearError clears lastError', () => {
    useGameStore.getState().setError({ code: 'X', messageKey: 'x' })
    useGameStore.getState().clearError()
    expect(useGameStore.getState().lastError).toBeNull()
  })
})
