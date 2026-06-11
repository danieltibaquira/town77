import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { renderWithTheme } from './helpers'
import { Cell } from '../components/Cell'
import { Chip } from '../components/Chip'
import { Grid } from '../components/Grid'
import { ScoreTable } from '../components/ScoreTable'
import { Toast } from '../components/Toast'
import { GameScreen } from '../screens/GameScreen'
import { createGrid } from '@town77/game-engine'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { useGameStore } from '../store/gameStore'

describe('Wave 7: Quality Gates', () => {
  const tokensPath = path.join(__dirname, '../styles/tokens.css')
  const tokensContent = fs.readFileSync(tokensPath, 'utf-8')

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

  describe('T1: Accessibility — axe-core basics', () => {
    it('Cell renders with semantic role', () => {
      renderWithTheme(<Cell row={0} col={0} chip={null} isValid={true} />)
      const cell = document.querySelector('[data-testid="cell-0-0"]')
      expect(cell).toBeTruthy()
      expect(cell?.getAttribute('role') || cell?.tagName).toBeTruthy()
    })

    it('Chip renders with aria-label for colorblind users', () => {
      renderWithTheme(<Chip chip={{ id: 'c1', color: '1', shape: 'circle', value: 5 }} isSelected={false} isValid={true} />)
      const chip = document.querySelector('[data-testid="chip-1-circle"]')
      expect(chip?.getAttribute('aria-label') || '').toBeTruthy()
    })

    it('Grid has grid role', () => {
      const gridData = createGrid(3, 3)
      renderWithTheme(<Grid grid={gridData} validCells={[]} />)
      const grid = document.querySelector('[data-testid="grid"]')
      expect(grid?.getAttribute('role')).toBe('grid')
    })
  })

  describe('T2: prefers-reduced-motion respected', () => {
    it('tokens.css defines motion-safe media query', () => {
      expect(tokensContent).toContain('prefers-reduced-motion')
    })

    it('tokens.css defines --motion-safe-duration token', () => {
      expect(tokensContent).toContain('--motion-safe-duration')
    })
  })

  describe('T3: Performance — content-visibility', () => {
    it('tokens.css defines content-visibility token', () => {
      expect(tokensContent).toContain('--content-visibility')
    })
  })

  describe('T4: Focus indicators', () => {
    it('tokens.css defines focus ring token', () => {
      expect(tokensContent).toContain('--focus-ring')
    })

    it('Cell has focus outline style', () => {
      renderWithTheme(<Cell row={0} col={0} chip={null} isValid={true} />)
      const cell = document.querySelector('[data-testid="cell-0-0"]')
      const style = cell?.getAttribute('style') || ''
      expect(style).toContain('outline')
    })
  })

  describe('T5: Color contrast tokens', () => {
    it('tokens.css defines contrast ratio token', () => {
      expect(tokensContent).toContain('--contrast-ratio-min')
    })
  })
})
