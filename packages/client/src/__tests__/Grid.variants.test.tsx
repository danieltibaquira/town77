import { screen } from '@testing-library/react'
import { createGrid } from '@town77/game-engine'
import type { Grid as GridType } from '@town77/shared-types'
import { describe, expect, it } from 'vitest'
import { Grid } from '../components/Grid'
import { renderWithTheme } from './helpers'

describe('Grid variants', () => {
  const emptyGrid: GridType = createGrid(7, 7)

  it('compact density sets data-density on grid and cells', () => {
    renderWithTheme(
      <Grid grid={emptyGrid} validCells={[]} density="compact" onCellClick={() => {}} />,
    )
    expect(screen.getByTestId('grid')).toHaveAttribute('data-density', 'compact')
    expect(screen.getByTestId('cell-0-0')).toHaveAttribute('data-density', 'compact')
  })
})
