import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Design System Tokens', () => {
  const projectRoot = path.join(__dirname, '../../../../')
  const tokensPath = path.join(projectRoot, 'packages/client/src/styles/tokens.css')
  const specPath = path.join(projectRoot, 'docs/design-system/spec-theme-and-voice.md')

  let tokensContent: string
  let specContent: string

  // Setup: read files before all tests
  beforeAll(() => {
    if (fs.existsSync(tokensPath)) {
      tokensContent = fs.readFileSync(tokensPath, 'utf-8')
    }
    if (fs.existsSync(specPath)) {
      specContent = fs.readFileSync(specPath, 'utf-8')
    }
  })

  // Setup: read files
  it('token files exist', () => {
    expect(fs.existsSync(tokensPath)).toBe(true)
    expect(fs.existsSync(specPath)).toBe(true)
  })

  describe('Primitive Tokens', () => {
    it('defines all duration primitives', () => {
      const durations = [
        '--duration-instant',
        '--duration-fast',
        '--duration-normal',
        '--duration-slow',
        '--duration-epic',
      ]
      durations.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })

    it('defines all easing primitives', () => {
      const eases = ['--ease-spring', '--ease-out', '--ease-bounce']
      eases.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })

    it('defines all spacing primitives', () => {
      const spaces = ['--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-2xl']
      spaces.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })

    it('defines all radius primitives', () => {
      const radii = [
        '--radius-sm',
        '--radius-md',
        '--radius-lg',
        '--radius-pill',
      ]
      radii.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })
  })

  describe('Semantic Tokens', () => {
    it('defines all surface color semantics', () => {
      const surfaces = [
        '--color-surface-bg',
        '--color-surface-grid',
        '--color-surface-cell',
        '--color-surface-cell-hover',
        '--color-surface-cell-valid',
        '--color-surface-cell-invalid',
      ]
      surfaces.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })

    it('defines all text color semantics', () => {
      const textColors = ['--color-text-primary', '--color-text-secondary', '--color-text-accent']
      textColors.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })

    it('defines 7 chip color semantics (color-1 through color-7)', () => {
      for (let i = 1; i <= 7; i++) {
        expect(tokensContent).toContain(`--chip-color-${i}`)
      }
    })
  })

  describe('Token Naming Conventions', () => {
    it('all tokens use kebab-case (lowercase with hyphens)', () => {
      const tokenMatches = tokensContent.match(/--[\w-]+/g) || []
      tokenMatches.forEach((token) => {
        expect(token).toMatch(/^--[a-z0-9\-]+$/)
      })
    })

    it('semantic tokens start with semantic prefix (color, duration, space, etc)', () => {
      const semanticTokens = [
        '--color-surface-bg',
        '--color-text-primary',
        '--space-md',
        '--duration-fast',
      ]
      semanticTokens.forEach((token) => {
        expect(tokensContent).toContain(token)
        // Extract category (word after first dash, skip the empty first element)
        const parts = token.split('-').filter(Boolean)
        expect(['color', 'duration', 'space', 'text', 'font', 'layout', 'radius', 'ease', 'chip']).toContain(parts[0])
      })
    })
  })

  describe('Token Spec Documentation', () => {
    it('spec section 3 documents token hierarchy', () => {
      expect(specContent).toContain('## 3. Token Hierarchy')
      expect(specContent).toContain('Layer 1: Primitives')
      expect(specContent).toContain('Layer 2: Semantic')
      expect(specContent).toContain('Layer 3: Component')
    })

    it('spec section 4 documents naming conventions', () => {
      expect(specContent).toContain('## 4. Token Naming Conventions')
      expect(specContent).toContain('Kebab-case')
      expect(specContent).toContain('Semantic, not descriptive')
    })

    it('spec section 4 includes token reference table', () => {
      expect(specContent).toContain('Token Reference Table')
      expect(specContent).toContain('--color-surface-bg')
      expect(specContent).toContain('--chip-color-1')
    })
  })
})
