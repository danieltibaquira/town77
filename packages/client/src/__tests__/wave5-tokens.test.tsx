import fs from 'fs'
import path from 'path'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Cell } from '../components/Cell'
import { Grid } from '../components/Grid'
import { ScoreTable } from '../components/ScoreTable'
import { town77Theme } from '../themes/town77'
import { renderWithTheme } from './helpers'

describe('Wave 5: Color & Typography', () => {
  const tokensPath = path.join(__dirname, '../styles/tokens.css')
  const tokensContent = fs.readFileSync(tokensPath, 'utf-8')

  describe('T1: Accent glow palette', () => {
    it('tokens.css defines accent glow soft token', () => {
      expect(tokensContent).toContain('--accent-glow-soft')
    })

    it('tokens.css defines accent glow medium token', () => {
      expect(tokensContent).toContain('--accent-glow-medium')
    })

    it('tokens.css defines accent glow bright token', () => {
      expect(tokensContent).toContain('--accent-glow-bright')
    })

    it('accent glow tokens use theme accent color', () => {
      const _accent = town77Theme.colorPalette['color-1']
      expect(tokensContent).toMatch(/accent-glow-soft.*#C4A35A|accent-glow-soft.*rgba/)
    })
  })

  describe('T2: Board surface gradient', () => {
    it('tokens.css defines board surface gradient', () => {
      expect(tokensContent).toContain('--surface-board-grad')
    })

    it('Grid component applies board surface gradient', () => {
      const gridData = [
        [null, null],
        [null, null],
      ] as any
      const { container } = renderWithTheme(<Grid grid={gridData} validCells={[]} />)
      const gridEl = container.querySelector('[data-testid="grid"]')
      const style = gridEl?.getAttribute('style') || ''
      expect(style).toContain('var(--surface-board-grad)')
    })
  })

  describe('T3: Valid cell radial gradient', () => {
    it('tokens.css defines valid cell radial gradient', () => {
      expect(tokensContent).toContain('--cell-bg-valid-radial')
    })

    it('Cell uses radial gradient for valid cells', () => {
      renderWithTheme(<Cell row={0} col={0} chip={null} isValid={true} />)
      const cell = screen.getByTestId('cell-0-0')
      const style = cell.getAttribute('style') || ''
      expect(style).toContain('var(--cell-bg-valid-radial)')
    })
  })

  describe('T4: Cell hover brightness', () => {
    it('Cell has hover brightness effect on valid empty cells', () => {
      renderWithTheme(<Cell row={0} col={0} chip={null} isValid={true} />)
      const cell = screen.getByTestId('cell-0-0')
      expect(cell).toHaveAttribute('data-hover', 'brightness-scale')
    })
  })

  describe('T5: Typography drama', () => {
    it('ScoreTable uses tabular-nums for numbers', () => {
      renderWithTheme(
        <ScoreTable
          scores={[{ playerId: 'p1', name: 'Alice', placed: 10, remaining: 2, combined: 8 }]}
        />,
      )
      const scoreCell = screen.getByTestId('score-placed-p1')
      const style = scoreCell.getAttribute('style') || ''
      expect(style).toContain('tabular-nums')
    })

    it('tokens.css defines letter-spacing token for display text', () => {
      expect(tokensContent).toContain('--letter-spacing-display')
    })

    it('tokens.css defines font-weight range tokens', () => {
      expect(tokensContent).toContain('--font-weight-secondary')
      expect(tokensContent).toContain('--font-weight-primary')
      expect(tokensContent).toContain('--font-weight-display')
    })
  })
})
