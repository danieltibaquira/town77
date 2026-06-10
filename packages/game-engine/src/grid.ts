import type { Chip, Grid } from '@town77/shared-types'

export function createGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array<Chip | null>(cols).fill(null))
}

export function isFirstChipOnGrid(grid: Grid): boolean {
  return grid.every(row => row.every(cell => cell === null))
}

export function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  chip: Chip,
  isFirstChip: boolean,
): boolean {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  if (row < 0 || row >= rows || col < 0 || col >= cols) return false
  if (grid[row]?.[col] !== null) return false
  if (isFirstChip) return true
  if (!hasAdjacentChip(grid, row, col)) return false

  for (let c = 0; c < cols; c++) {
    const cell = grid[row]?.[c]
    if (cell != null) {
      if (cell.color === chip.color || cell.shape === chip.shape) return false
    }
  }

  for (let r = 0; r < rows; r++) {
    const cell = grid[r]?.[col]
    if (cell != null) {
      if (cell.color === chip.color || cell.shape === chip.shape) return false
    }
  }

  return true
}

function hasAdjacentChip(grid: Grid, row: number, col: number): boolean {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  return (
    [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]] as [number, number][]
  ).some(([r, c]) => r >= 0 && r < rows && c >= 0 && c < cols && grid[r]?.[c] != null)
}

export function applyPlacement(grid: Grid, row: number, col: number, chip: Chip): Grid {
  const next = grid.map(r => [...r])
  next[row]![col] = chip
  return next as Grid
}

export function getValidCells(
  grid: Grid,
  chip: Chip,
  isFirstChip: boolean,
): [number, number][] {
  const valid: [number, number][] = []
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[0]?.length ?? 0); c++) {
      if (isValidPlacement(grid, r, c, chip, isFirstChip)) valid.push([r, c])
    }
  }
  return valid
}

export function gridIsConsistent(grid: Grid): boolean {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  for (let r = 0; r < rows; r++) {
    const chips = (grid[r] ?? []).filter((c): c is Chip => c !== null)
    const colors = chips.map(c => c.color)
    const shapes = chips.map(c => c.shape)
    if (new Set(colors).size !== colors.length) return false
    if (new Set(shapes).size !== shapes.length) return false
  }

  for (let c = 0; c < cols; c++) {
    const chips = grid.map(r => r[c]).filter((c): c is Chip => c !== null)
    const colors = chips.map(ch => ch.color)
    const shapes = chips.map(ch => ch.shape)
    if (new Set(colors).size !== colors.length) return false
    if (new Set(shapes).size !== shapes.length) return false
  }

  return true
}
