import { describe, expect, it } from 'vitest'
import { town77Theme } from '../../themes/town77'
import { assertValidTheme } from '../helpers/theme-assertions'

describe('assertValidTheme', () => {
  it('passes for town77Theme', () => {
    expect(() => assertValidTheme(town77Theme)).not.toThrow()
  })

  it('throws when shapes count is not 7', () => {
    const bad = { ...town77Theme, shapes: { cottage: 'M0 0' } }
    expect(() => assertValidTheme(bad as typeof town77Theme)).toThrow(/7 shapes/)
  })
})
