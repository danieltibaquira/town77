import { describe, it, expect } from 'vitest'
import { getThemeByIdSafe, isValidThemeId } from '../../themes'

// P1#3: theme ids that arrive from untrusted sources (cycle order, persisted
// prefs, server state) must be validated against the known set and fall back
// to the default theme rather than throwing and crashing the render.
describe('isValidThemeId', () => {
  it('returns true for registered theme ids', () => {
    expect(isValidThemeId('town77')).toBe(true)
    expect(isValidThemeId('playful-pastel')).toBe(true)
    expect(isValidThemeId('neobrutalism')).toBe(true)
  })

  it('returns false for unknown ids', () => {
    expect(isValidThemeId('bogus')).toBe(false)
    expect(isValidThemeId('')).toBe(false)
  })
})

describe('getThemeByIdSafe', () => {
  it('returns the matching theme for a known id', () => {
    expect(getThemeByIdSafe('playful-pastel').id).toBe('playful-pastel')
  })

  it('falls back to the default (town77) for an unknown id', () => {
    expect(getThemeByIdSafe('does-not-exist').id).toBe('town77')
  })
})
