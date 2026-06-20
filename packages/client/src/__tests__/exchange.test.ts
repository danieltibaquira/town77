import { describe, it, expect } from 'vitest'
import type { Chip } from '@town77/shared-types'
import { selectExchangeSet } from '../lib/exchange'

const config = { min: 3, max: 4 }
const RED_COTTAGE: Chip = { color: 'color-1', shape: 'cottage' }
const RED_TOWER: Chip = { color: 'color-1', shape: 'tower' }
const RED_BARN: Chip = { color: 'color-1', shape: 'barn' }
const RED_ROWHOUSE: Chip = { color: 'color-1', shape: 'rowhouse' }
const BLUE_COTTAGE: Chip = { color: 'color-2', shape: 'cottage' }

// Exchange UI: a player exchanges the same-color group of the selected chip,
// requiring at least config.min of that color, capped at config.max.
describe('selectExchangeSet', () => {
  it('returns null when no chip is selected', () => {
    expect(selectExchangeSet([RED_COTTAGE, RED_TOWER, RED_BARN], null, config)).toBeNull()
  })

  it('returns the same-color group when it meets the minimum', () => {
    const set = selectExchangeSet([RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE], RED_COTTAGE, config)
    expect(set).not.toBeNull()
    expect(set).toHaveLength(3)
    expect(set!.every((c) => c.color === 'color-1')).toBe(true)
  })

  it('returns null when the selected color has fewer than the minimum', () => {
    // only 2 red chips
    expect(selectExchangeSet([RED_COTTAGE, RED_TOWER, BLUE_COTTAGE], RED_COTTAGE, config)).toBeNull()
  })

  it('caps the set at config.max', () => {
    const set = selectExchangeSet(
      [RED_COTTAGE, RED_TOWER, RED_BARN, RED_ROWHOUSE],
      RED_COTTAGE,
      config,
    )
    expect(set).toHaveLength(4)
  })
})
