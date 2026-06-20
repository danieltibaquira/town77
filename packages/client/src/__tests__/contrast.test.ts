import { describe, it, expect } from 'vitest'
import { contrastRatio, meetsWcagAA } from '../lib/contrast'

// P1#11: parseHexColor assumed a 6-digit #rrggbb. Shorthand (#fff) or a
// malformed value silently produced NaN channels -> NaN ratio -> meetsWcagAA
// returning false for a valid color (or masking a real failure). The contrast
// utility underpins P1#1's accessibility checks, so a silent NaN is a defect.

describe('contrastRatio robustness', () => {
  it('computes a correct ratio for 6-digit hex', () => {
    // white on black is the maximum 21:1
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0)
  })

  it('expands 3-digit shorthand hex', () => {
    // #fff -> #ffffff, #000 -> #000000
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 0)
  })

  it('never returns NaN for valid shorthand input', () => {
    expect(Number.isNaN(contrastRatio('#abc', '#1e293b'))).toBe(false)
  })

  it('throws on malformed hex rather than yielding NaN', () => {
    expect(() => contrastRatio('not-a-color', '#000000')).toThrow()
    expect(() => meetsWcagAA('#12', '#000000', 3)).toThrow()
  })
})
