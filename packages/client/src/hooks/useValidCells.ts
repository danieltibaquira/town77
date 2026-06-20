import { useMemo } from 'react'
import type { Chip, Grid } from '@town77/shared-types'
import { getValidCells, isFirstChipOnGrid } from '@town77/game-engine'

export function useValidCells(grid: Grid | null | undefined, selectedChip: Chip | null): [number, number][] {
  return useMemo(() => {
    if (!grid || !selectedChip) return []
    return getValidCells(grid, selectedChip, isFirstChipOnGrid(grid))
  }, [grid, selectedChip])
}
