import { describe, expect, it } from 'vitest'
import { contrastRatio, meetsWcagAA } from '../../lib/contrast'

describe('contrast', () => {
  it('returns ~21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('meetsWcagAA returns true at 4.5:1', () => {
    expect(meetsWcagAA('#ffffff', '#000000')).toBe(true)
  })

  it('meetsWcagAA returns false below 4.5:1', () => {
    expect(meetsWcagAA('#888888', '#999999')).toBe(false)
  })
})
