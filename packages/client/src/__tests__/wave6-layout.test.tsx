import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { screen } from '@testing-library/react'
import { createGrid } from '@town77/game-engine'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { renderWithTheme } from './helpers'
import { Cell } from '../components/Cell'
import { Grid } from '../components/Grid'
import { GameScreen } from '../screens/GameScreen'
import { useGameStore } from '../store/gameStore'
import { town77Theme } from '../themes/town77'

function makeGameState() {
  return {
    grid: createGrid(7, 7),
    bag: [],
    players: [
      { id: 'p1', name: 'Alice', hand: [], placed: 0, hasDiscarded: false, connected: true },
    ],
    turnIndex: 0,
    phase: 'playing' as const,
    config: DEFAULT_GAME_CONFIG,
    themeId: 'town77',
    seed: 42,
  }
}

describe('Wave 6: Layout Robustness', () => {
  const tokensPath = path.join(__dirname, '../styles/tokens.css')
  const tokensContent = fs.readFileSync(tokensPath, 'utf-8')

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
  })

  describe('T1: Container queries for GameScreen', () => {
    it('tokens.css defines container query tokens', () => {
      expect(tokensContent).toContain('--container-narrow')
      expect(tokensContent).toContain('--container-wide')
      expect(tokensContent).toContain('--container-breakpoint')
    })

    it('GameScreen uses container query for responsive layout', () => {
      useGameStore.setState({
        gameState: makeGameState(),
        playerId: 'p1',
        connected: true,
      })
      const { container } = renderWithTheme(<GameScreen />)
      const gameScreen = container.querySelector('[data-testid="game-screen"]')
      const style = gameScreen?.getAttribute('style') || ''
      expect(style).toContain('container-type')
    })
  })

  describe('T2: aspect-ratio on cells', () => {
    it('Cell has aspect-ratio: 1', () => {
      renderWithTheme(<Cell row={0} col={0} chip={null} isValid={true} />)
      const cell = screen.getByTestId('cell-0-0')
      const style = cell.getAttribute('style') || ''
      expect(style).toContain('aspect-ratio: 1')
    })
  })

  describe('T3: Responsive panel rearrangement', () => {
    it('GameScreen has responsive panel layout', () => {
      useGameStore.setState({
        gameState: makeGameState(),
        playerId: 'p1',
        connected: true,
      })
      const { container } = renderWithTheme(<GameScreen />)
      const panel = container.querySelector('[data-testid="game-panel"]')
      expect(panel).not.toBeNull()
    })
  })

  describe('T4: Font loading optimization', () => {
    it('tokens.css defines font-display token', () => {
      expect(tokensContent).toContain('--font-display')
    })

    it('tokens.css defines font-family fallbacks', () => {
      expect(tokensContent).toContain('--font-family-fallback')
    })
  })

  describe('T5: Layout stability tokens', () => {
    it('tokens.css defines contain property for layout', () => {
      expect(tokensContent).toContain('--layout-contain')
    })

    it('tokens.css defines content-visibility token', () => {
      expect(tokensContent).toContain('--content-visibility')
    })
  })
})
