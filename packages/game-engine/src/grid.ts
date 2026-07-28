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

  const rowChips = (grid[row] ?? []).filter((cell): cell is Chip => cell !== null)
  const columnChips = grid.map((line) => line[col]).filter((cell): cell is Chip => cell !== null)

  if (!rowChips.every((cell) => differsInColorAndShape(cell, chip))) return false
  if (!columnChips.every((cell) => differsInColorAndShape(cell, chip))) return false

  return true
}

function differsInColorAndShape(a: Chip, b: Chip): boolean {
  return a.color !== b.color && a.shape !== b.shape
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
    if (!areLinesConsistent((grid[r] ?? []).filter((cell): cell is Chip => cell !== null))) return false
  }

  for (let c = 0; c < cols; c++) {
    if (!areLinesConsistent(grid.map((row) => row[c]).filter((cell): cell is Chip => cell !== null))) return false
  }

  return true
}

function areLinesConsistent(chips: Chip[]): boolean {
  return chips.every((chip, index) => chips.slice(index + 1).every((other) => differsInColorAndShape(chip, other)))
}
