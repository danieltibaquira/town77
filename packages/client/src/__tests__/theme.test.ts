import { beforeEach, describe, expect, it } from 'vitest'
import { injectTokens } from '../lib/theme'
import { town77Theme } from '../themes/town77'

describe('injectTokens', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style')
  })

  it('sets --color-surface-bg from theme', () => {
    injectTokens(town77Theme)
    expect(document.documentElement.style.getPropertyValue('--color-surface-bg')).toBe('#0F0D17')
  })

  it('sets --color-surface-grid from theme', () => {
    injectTokens(town77Theme)
    expect(document.documentElement.style.getPropertyValue('--color-surface-grid')).toBe('#1C1828')
  })

  it('sets chip color CSS vars for palette entries', () => {
    injectTokens(town77Theme)
    expect(document.documentElement.style.getPropertyValue('--chip-color-1')).toBe('#D4623A')
    expect(document.documentElement.style.getPropertyValue('--chip-color-7')).toBe('#E8D5B0')
  })

  it('sets --font-display from theme', () => {
    injectTokens(town77Theme)
    expect(document.documentElement.style.getPropertyValue('--font-display')).toBe(
      "'Bebas Neue', sans-serif",
    )
  })
})
