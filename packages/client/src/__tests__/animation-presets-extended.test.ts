import { describe, it, expect } from 'vitest'
import { town77Theme } from '../themes/town77'
import { playfulPastelTheme } from '../themes/playful-pastel'
import type { AnimationPreset } from '@town77/shared-types'

const themes = [town77Theme, playfulPastelTheme]

const expectedKeys: (keyof AnimationPreset)[] = [
  'chipPlace',
  'chipInvalid',
  'chipDraw',
  'cellPulse',
  'turnIn',
  'celebrate',
  'chipDrawIn',
  'placementRipple',
  'turnSweep',
  'scorePop',
  'bagShake',
  'hoverLift',
  'handReorder',
  'badgeGlowPulse',
  'exchangeFlash',
  'discardFade',
  'cellEntrance',
  'errorShake',
]

describe('Extended AnimationPreset (Wave 4)', () => {
  it('AnimationPreset has 18 fields (6 existing + 12 new)', () => {
    const preset: AnimationPreset = town77Theme.animationPreset
    expect(Object.keys(preset).length).toBe(expectedKeys.length)
  })

  it.each(expectedKeys)('has field %s in all themes', (key) => {
    for (const theme of themes) {
      expect(theme.animationPreset).toHaveProperty(key)
    }
  })

  describe('chipDrawIn — staggered chip entry', () => {
    it('has duration, stagger, and ease', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.chipDrawIn
        expect(p.duration).toBeGreaterThan(0)
        expect(p.stagger).toBeGreaterThan(0)
        expect(typeof p.ease).toBe('string')
      }
    })
  })

  describe('placementRipple — expanding ring on place', () => {
    it('has duration, maxScale, and ease', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.placementRipple
        expect(p.duration).toBeGreaterThan(0)
        expect(p.maxScale).toBeGreaterThan(1)
        expect(typeof p.ease).toBe('string')
      }
    })
  })

  describe('turnSweep — turn indicator animation', () => {
    it('has duration and ease', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.turnSweep
        expect(p.duration).toBeGreaterThan(0)
        expect(typeof p.ease).toBe('string')
      }
    })
  })

  describe('scorePop — score number bounce', () => {
    it('is a SpringConfig', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.scorePop
        expect(p.type).toBe('spring')
        expect(p.stiffness).toBeGreaterThan(0)
        expect(p.damping).toBeGreaterThan(0)
        expect(p.mass).toBeGreaterThan(0)
      }
    })
  })

  describe('bagShake — bag oscillation on draw', () => {
    it('has x array and duration', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.bagShake
        expect(Array.isArray(p.x)).toBe(true)
        expect(p.x.length).toBeGreaterThan(0)
        expect(p.duration).toBeGreaterThan(0)
      }
    })
  })

  describe('hoverLift — card hover elevation', () => {
    it('has scale > 1, duration, ease', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.hoverLift
        expect(p.scale).toBeGreaterThan(1)
        expect(p.duration).toBeGreaterThan(0)
        expect(typeof p.ease).toBe('string')
      }
    })
  })

  describe('handReorder — FLIP animation for hand chips', () => {
    it('has duration and ease', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.handReorder
        expect(p.duration).toBeGreaterThan(0)
        expect(typeof p.ease).toBe('string')
      }
    })
  })

  describe('badgeGlowPulse — badge glow oscillation', () => {
    it('has duration, minOpacity, maxOpacity', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.badgeGlowPulse
        expect(p.duration).toBeGreaterThan(0)
        expect(p.minOpacity).toBeGreaterThanOrEqual(0)
        expect(p.maxOpacity).toBeLessThanOrEqual(1)
        expect(p.maxOpacity).toBeGreaterThan(p.minOpacity)
      }
    })
  })

  describe('exchangeFlash — brief white flash overlay', () => {
    it('has duration and opacity', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.exchangeFlash
        expect(p.duration).toBeGreaterThan(0)
        expect(p.opacity).toBeGreaterThan(0)
        expect(p.opacity).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('discardFade — fade out on discard', () => {
    it('has duration, endScale < 1, ease', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.discardFade
        expect(p.duration).toBeGreaterThan(0)
        expect(p.endScale).toBeGreaterThan(0)
        expect(p.endScale).toBeLessThan(1)
        expect(typeof p.ease).toBe('string')
      }
    })
  })

  describe('cellEntrance — staggered cell entry on mount', () => {
    it('has duration, stagger, ease', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.cellEntrance
        expect(p.duration).toBeGreaterThan(0)
        expect(p.stagger).toBeGreaterThan(0)
        expect(typeof p.ease).toBe('string')
      }
    })
  })

  describe('errorShake — enhanced shake with border flash', () => {
    it('has x array, duration, borderFlash flag', () => {
      for (const theme of themes) {
        const p = theme.animationPreset.errorShake
        expect(Array.isArray(p.x)).toBe(true)
        expect(p.x.length).toBeGreaterThan(0)
        expect(p.duration).toBeGreaterThan(0)
        expect(typeof p.borderFlash).toBe('boolean')
      }
    })
  })
})
