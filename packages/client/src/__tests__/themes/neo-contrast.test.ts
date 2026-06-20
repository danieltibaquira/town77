import { describe, it, expect, beforeEach } from 'vitest'
import { injectTokens } from '../../lib/theme'
import { getThemeById } from '../../themes'

// WCAG relative luminance + contrast ratio.
function relLuminance(hex: string): number {
  const c = hex.replace('#', '')
  const n = c.length === 3 ? c.split('').map((x) => x + x).join('') : c
  const lin = [0, 2, 4]
    .map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!
}
function contrast(a: string, b: string): number {
  const l1 = relLuminance(a)
  const l2 = relLuminance(b)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}

function tokensFor(themeId: 'neobrutalism' | 'town77' | 'playful-pastel') {
  injectTokens(getThemeById(themeId))
  const s = document.documentElement.style
  return (name: string) => s.getPropertyValue(name).trim()
}

describe('neobrutalism theme contrast (WCAG AA)', () => {
  let get: (name: string) => string
  beforeEach(() => {
    get = tokensFor('neobrutalism')
  })

  it('primary text on panel surface (player badges) >= 4.5', () => {
    expect(contrast(get('--color-text-primary'), get('--color-surface-panel'))).toBeGreaterThanOrEqual(4.5)
  })

  it('secondary text on panel surface (disabled action buttons) >= 3', () => {
    expect(contrast(get('--color-text-secondary'), get('--color-surface-panel'))).toBeGreaterThanOrEqual(3)
  })

  it('primary text on background >= 4.5', () => {
    expect(contrast(get('--color-text-primary'), get('--color-surface-bg'))).toBeGreaterThanOrEqual(4.5)
  })
})
