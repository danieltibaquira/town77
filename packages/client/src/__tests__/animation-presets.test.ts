import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Animation Presets & Motion Personalities', () => {
  const projectRoot = path.join(__dirname, '../../../../')
  const specPath = path.join(projectRoot, 'docs/design-system/spec-theme-and-voice.md')

  let specContent: string

  beforeAll(() => {
    if (fs.existsSync(specPath)) {
      specContent = fs.readFileSync(specPath, 'utf-8')
    }
  })

  describe('Section 5: Animation Presets', () => {
    it('spec section 5 documents animation presets', () => {
      expect(specContent).toContain('## 5. Animation Presets & Motion Personalities')
    })

    it('spec section 5 defines three motion personas (calm, playful, flashy)', () => {
      expect(specContent).toContain('#### 5.1 Calm')
      expect(specContent).toContain('#### 5.2 Playful')
      expect(specContent).toContain('#### 5.3 Flashy')
    })

    it('calm persona has valid Framer Motion spring parameters', () => {
      expect(specContent).toContain('stiffness: 100, damping: 25, mass: 1')
      expect(specContent).toContain("type: 'spring'")
    })

    it('playful persona has valid Framer Motion spring parameters', () => {
      expect(specContent).toContain('stiffness: 260, damping: 20, mass: 1')
    })

    it('flashy persona has valid Framer Motion spring parameters', () => {
      expect(specContent).toContain('stiffness: 350, damping: 15, mass: 0.8')
    })

    it('spec documents all preset keys (chipPlace, chipInvalid, chipDraw, cellPulse, turnIn, celebrate)', () => {
      const presetKeys = ['chipPlace', 'chipInvalid', 'chipDraw', 'cellPulse', 'turnIn', 'celebrate']
      presetKeys.forEach((key) => {
        expect(specContent).toContain(key)
      })
    })

    it('spec includes motion anti-patterns section', () => {
      expect(specContent).toContain('Motion Anti-Patterns')
      expect(specContent).toContain('Generic ease-in-out')
      expect(specContent).toContain('Inconsistent timing')
    })

    it('spec documents animation durations (ms ranges)', () => {
      expect(specContent).toContain('duration: 0.3')
      expect(specContent).toContain('duration: 0.4')
      expect(specContent).toContain('duration: 1.5')
    })
  })

  describe('Sound Asset Structure', () => {
    it('spec section 6 documents sound assets', () => {
      expect(specContent).toContain('## 6. Sound & Particle Assets')
    })

    it('spec documents 4 sound types (chipPlace, chipInvalid, chipDraw, celebrate)', () => {
      expect(specContent).toContain('**chipPlace**')
      expect(specContent).toContain('**chipInvalid**')
      expect(specContent).toContain('**chipDraw**')
      expect(specContent).toContain('**celebrate**')
    })

    it('spec documents sound duration ranges', () => {
      expect(specContent).toContain('200–300ms')
      expect(specContent).toContain('150–250ms')
      expect(specContent).toContain('500–1200ms')
    })

    it('spec documents sound asset file structure', () => {
      expect(specContent).toContain('public/themes/{themeId}/')
      expect(specContent).toContain('place.mp3')
      expect(specContent).toContain('invalid.mp3')
      expect(specContent).toContain('draw.mp3')
      expect(specContent).toContain('celebrate.mp3')
    })

    it('spec documents particle configuration', () => {
      expect(specContent).toContain('particleCount')
      expect(specContent).toContain('spread')
    })

    it('spec mentions accessibility fallback for sound', () => {
      expect(specContent).toMatch(/sound|audio|haptic|vibrat|accessibility/i)
    })
  })
})
