import { test } from '@fast-check/vitest'
import type { Chip } from '@town77/shared-types'
import * as fc from 'fast-check'
import { expect } from 'vitest'
import {
  applyPlacement,
  createGrid,
  getValidCells,
  gridIsConsistent,
  isFirstChipOnGrid,
  isValidPlacement,
} from '../grid'

const COLORS = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7']
const SHAPES = ['cottage', 'rowhouse', 'tower', 'victorian', 'barn', 'bungalow', 'skyscraper']

const arbitraryChip = (): fc.Arbitrary<Chip> =>
  fc.record({
    color: fc.constantFrom(...COLORS),
    shape: fc.constantFrom(...SHAPES),
  })

const arbitraryCoord = () => fc.integer({ min: 0, max: 6 })

test.prop([arbitraryCoord(), arbitraryCoord(), arbitraryChip()])(
  'any valid placement preserves grid consistency',
  (row, col, chip) => {
    const grid = createGrid(7, 7)
    const isFirst = isFirstChipOnGrid(grid)
    fc.pre(isValidPlacement(grid, row, col, chip, isFirst))
    const next = applyPlacement(grid, row, col, chip)
    expect(gridIsConsistent(next)).toBe(true)
  },
)

test.prop([arbitraryChip()])(
  'getValidCells never returns a cell that fails isValidPlacement',
  (chip) => {
    const grid = createGrid(7, 7)
    const validCells = getValidCells(grid, chip, true)
    validCells.forEach(([r, c]) => {
      expect(isValidPlacement(grid, r, c, chip, true)).toBe(true)
    })
  },
)

test.prop([arbitraryCoord(), arbitraryCoord(), arbitraryChip()])(
  'applyPlacement does not mutate the original grid',
  (row, col, chip) => {
    const grid = createGrid(7, 7)
    const original = JSON.stringify(grid)
    applyPlacement(grid, row, col, chip)
    expect(JSON.stringify(grid)).toBe(original)
  },
)

test.prop([arbitraryCoord(), arbitraryCoord(), arbitraryChip(), arbitraryChip()])(
  'isValidPlacement is false for any occupied cell',
  (row, col, existing, candidate) => {
    const grid = applyPlacement(createGrid(7, 7), row, col, existing)
    expect(isValidPlacement(grid, row, col, candidate, false)).toBe(false)
  },
)
