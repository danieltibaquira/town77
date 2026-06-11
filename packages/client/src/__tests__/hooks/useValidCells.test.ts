import { renderHook } from '@testing-library/react'
import type { Chip, Grid } from '@town77/shared-types'
import { describe, expect, it } from 'vitest'
import { useValidCells } from '../../hooks/useValidCells'

describe('useValidCells', () => {
  const emptyGrid: Grid = Array.from({ length: 7 }, () => Array(7).fill(null))
  const chip: Chip = { color: 'color-1', shape: 'cottage' }

  it('returns all cells when grid is empty (first chip can go anywhere)', () => {
    const { result } = renderHook(() => useValidCells(emptyGrid, chip))
    expect(result.current).toHaveLength(49)
  })

  it('returns empty array when no chip selected', () => {
    const { result } = renderHook(() => useValidCells(emptyGrid, null))
    expect(result.current).toHaveLength(0)
  })

  it('filters cells after a chip is placed', () => {
    const grid: Grid = Array.from({ length: 7 }, () => Array(7).fill(null))
    grid[3]![3] = { color: 'color-1', shape: 'cottage' }
    const nextChip: Chip = { color: 'color-2', shape: 'tower' }
    const { result } = renderHook(() => useValidCells(grid, nextChip))
    // Should only include adjacent cells that pass row/column uniqueness
    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current.length).toBeLessThan(49)
    // Each returned cell should be a [row, col] tuple
    for (const [r, c] of result.current) {
      expect(r).toBeGreaterThanOrEqual(0)
      expect(c).toBeGreaterThanOrEqual(0)
    }
  })
})
