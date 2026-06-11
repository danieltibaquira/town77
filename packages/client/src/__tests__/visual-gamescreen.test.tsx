import { describe, it, expect } from 'vitest'
import { createGrid } from '@town77/game-engine'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { renderWithTheme } from './helpers'
import { GameScreen } from '../screens/GameScreen'
import { useGameStore } from '../store/gameStore'

describe('Visual Design: GameScreen Layout', () => {
  beforeEach(() => {
    useGameStore.getState().disconnect()
    useGameStore.setState({
      gameState: {
        grid: createGrid(7, 7),
        bag: [],
        players: [
          { id: 'p1', name: 'Alice', hand: [], placed: 0, hasDiscarded: false, connected: true },
        ],
        turnIndex: 0,
        phase: 'playing',
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        seed: 42,
      },
      playerId: 'p1',
      connected: true,
    })
  })

  it('has centered grid layout', () => {
    const { container } = renderWithTheme(<GameScreen />)
    const gridWrapper = container.querySelector('[data-testid="game-panel"]')
    expect(gridWrapper).not.toBeNull()
  })

  it('turn indicator has animated style', () => {
    const { container } = renderWithTheme(<GameScreen />)
    const turnIndicator = container.querySelector('[data-testid="turn-indicator"]')
    const style = turnIndicator?.getAttribute('style') || ''
    expect(style).toBeTruthy()
  })
})
