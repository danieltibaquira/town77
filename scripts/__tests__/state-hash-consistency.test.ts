import { describe, test, expect } from 'vitest'
import { computeBoardHash } from '../lib/boardHash'
import type { Grid } from '@town77/shared-types'

describe('boardStateHash consistency across 5 bots', () => {
  test('5 bots compute identical hash for the same non-empty grid', () => {
    const grid: Grid = Array.from({ length: 7 }, (_row, r) =>
      Array.from({ length: 7 }, (_col, c) => {
        if (r === 3 && c === 3) return { color: 'color-1', shape: 'cottage' }
        if (r === 3 && c === 4) return { color: 'color-1', shape: 'tower' }
        return null
      }),
    )

    const hashes = Array.from({ length: 5 }, () => computeBoardHash(grid))
    expect(new Set(hashes).size).toBe(1)
  })

  test('different grid states produce different hashes', () => {
    const grid1: Grid = [[{ color: 'color-1', shape: 'cottage' }]]
    const grid2: Grid = [[{ color: 'color-2', shape: 'tower' }]]

    expect(computeBoardHash(grid1)).not.toBe(computeBoardHash(grid2))
  })

  test('hash is a non-empty string', () => {
    const grid: Grid = [[null, { color: 'color-3', shape: 'barn' }]]
    const hash = computeBoardHash(grid)
    expect(hash).toBeTruthy()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
  })

  test('hash is deterministic across repeated calls', () => {
    const grid: Grid = [[{ color: 'color-4', shape: 'skyscraper' }, null]]
    const h1 = computeBoardHash(grid)
    const h2 = computeBoardHash(grid)
    expect(h1).toBe(h2)
  })
})
