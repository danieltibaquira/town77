import { describe, expect, it } from 'vitest'
import type { Chip, Grid } from '@town77/shared-types'
import {
  applyPlacement,
  createGrid,
  getValidCells,
  gridIsConsistent,
  isFirstChipOnGrid,
  isValidPlacement,
} from '../grid'

const COTTAGE_RED: Chip = { color: 'color-1', shape: 'cottage' }
const TOWER_RED: Chip = { color: 'color-1', shape: 'tower' }
const COTTAGE_BLUE: Chip = { color: 'color-2', shape: 'cottage' }
const TOWER_BLUE: Chip = { color: 'color-2', shape: 'tower' }
const BARN_GREEN: Chip = { color: 'color-3', shape: 'barn' }

describe('createGrid', () => {
  it('creates a grid with correct dimensions', () => {
    const grid = createGrid(7, 7)
    expect(grid).toHaveLength(7)
    grid.forEach(row => {
      expect(row).toHaveLength(7)
      row.forEach(cell => expect(cell).toBeNull())
    })
  })
})

describe('isFirstChipOnGrid', () => {
  it('returns true for empty grid', () => {
    expect(isFirstChipOnGrid(createGrid(7, 7))).toBe(true)
  })

  it('returns false when at least one chip is placed', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isFirstChipOnGrid(grid)).toBe(false)
  })
})

describe('isValidPlacement — first chip', () => {
  it('allows first chip anywhere on empty grid', () => {
    const grid = createGrid(7, 7)
    expect(isValidPlacement(grid, 0, 0, COTTAGE_RED, true)).toBe(true)
    expect(isValidPlacement(grid, 6, 6, COTTAGE_RED, true)).toBe(true)
    expect(isValidPlacement(grid, 3, 3, COTTAGE_RED, true)).toBe(true)
  })

  it('rejects out-of-bounds coordinates', () => {
    const grid = createGrid(7, 7)
    expect(isValidPlacement(grid, -1, 0, COTTAGE_RED, true)).toBe(false)
    expect(isValidPlacement(grid, 0, 7, COTTAGE_RED, true)).toBe(false)
    expect(isValidPlacement(grid, 7, 0, COTTAGE_RED, true)).toBe(false)
  })
})

describe('isValidPlacement — adjacency', () => {
  it('rejects placement not adjacent to any chip', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 0, 0, TOWER_BLUE, false)).toBe(false)
  })

  it('allows placement adjacent to existing chip', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 3, 4, TOWER_BLUE, false)).toBe(true)
    expect(isValidPlacement(grid, 4, 3, TOWER_BLUE, false)).toBe(true)
    expect(isValidPlacement(grid, 3, 2, TOWER_BLUE, false)).toBe(true)
    expect(isValidPlacement(grid, 2, 3, TOWER_BLUE, false)).toBe(true)
  })

  it('rejects diagonal placement', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 4, 4, TOWER_BLUE, false)).toBe(false)
  })

  it('rejects occupied cell', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 3, 3, TOWER_BLUE, false)).toBe(false)
  })
})

describe('isValidPlacement — row/column uniqueness', () => {
  it('rejects chip with duplicate color in same row', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    // TOWER_RED has same color as COTTAGE_RED — same row
    expect(isValidPlacement(grid, 3, 4, TOWER_RED, false)).toBe(false)
  })

  it('rejects chip with duplicate shape in same row', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    // COTTAGE_BLUE has same shape as COTTAGE_RED — same row
    expect(isValidPlacement(grid, 3, 4, COTTAGE_BLUE, false)).toBe(false)
  })

  it('rejects chip with duplicate color in same column', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 4, 3, TOWER_RED, false)).toBe(false)
  })

  it('rejects chip with duplicate shape in same column', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 4, 3, COTTAGE_BLUE, false)).toBe(false)
  })

  it('allows chip with unique color and shape in row and column', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 3, 4, TOWER_BLUE, false)).toBe(true)
  })
})

describe('applyPlacement', () => {
  it('places chip at correct position', () => {
    const grid = createGrid(7, 7)
    const next = applyPlacement(grid, 2, 5, COTTAGE_RED)
    expect(next[2]![5]).toEqual(COTTAGE_RED)
  })

  it('does not mutate input grid', () => {
    const grid = createGrid(7, 7)
    applyPlacement(grid, 2, 5, COTTAGE_RED)
    expect(grid[2]![5]).toBeNull()
  })
})

describe('getValidCells', () => {
  it('returns all cells for first chip', () => {
    const grid = createGrid(7, 7)
    const cells = getValidCells(grid, COTTAGE_RED, true)
    expect(cells).toHaveLength(49)
  })

  it('returns only adjacent cells with no conflict for second chip', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    const cells = getValidCells(grid, TOWER_BLUE, false)
    // Must be adjacent to (3,3) AND have no color/shape conflicts
    expect(cells.length).toBeGreaterThan(0)
    cells.forEach(([r, c]) => {
      expect(isValidPlacement(grid, r, c, TOWER_BLUE, false)).toBe(true)
    })
  })
})

describe('gridIsConsistent', () => {
  it('returns true for empty grid', () => {
    expect(gridIsConsistent(createGrid(7, 7))).toBe(true)
  })

  it('returns true for valid placements', () => {
    let grid = createGrid(7, 7)
    grid = applyPlacement(grid, 3, 3, COTTAGE_RED)
    grid = applyPlacement(grid, 3, 4, TOWER_BLUE)
    grid = applyPlacement(grid, 4, 3, BARN_GREEN)
    expect(gridIsConsistent(grid)).toBe(true)
  })

  it('returns false when row has duplicate color', () => {
    let grid = createGrid(7, 7)
    // Force an invalid state directly (bypassing validation)
    const raw = grid.map(r => [...r]) as Grid
    raw[3]![3] = COTTAGE_RED
    raw[3]![4] = TOWER_RED // same color in same row
    expect(gridIsConsistent(raw)).toBe(false)
  })

  it('returns false when column has duplicate shape', () => {
    const raw = createGrid(7, 7).map(r => [...r]) as Grid
    raw[3]![3] = COTTAGE_RED
    raw[4]![3] = COTTAGE_BLUE // same shape in same column
    expect(gridIsConsistent(raw)).toBe(false)
  })
})
