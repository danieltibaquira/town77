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
      const spaces = ['--space-2xs', '--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-2xl', '--space-3xl']
      spaces.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })

    it('spacing scale has smooth progression (2-4-8-16-24-32-48-64)', () => {
      const expectedValues: Record<string, string> = {
        '--space-2xs': '2px',
        '--space-xs': '4px',
        '--space-sm': '8px',
        '--space-md': '16px',
        '--space-lg': '24px',
        '--space-xl': '32px',
        '--space-2xl': '48px',
        '--space-3xl': '64px',
      }
      Object.entries(expectedValues).forEach(([token, value]) => {
        const match = tokensContent.match(new RegExp(`${token.replace(/--/, '--')}:\\s*(${value});`))
        expect(match).not.toBeNull()
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

    it('defines all typography primitives with clamp() for fluid sizing', () => {
      expect(tokensContent).toMatch(/--text-sm:\s*clamp\(\s*11px\s*,\s*2vw\s*,\s*13px\s*\)/)
      expect(tokensContent).toMatch(/--text-base:\s*clamp\(\s*14px\s*,\s*3vw\s*,\s*16px\s*\)/)
      expect(tokensContent).toMatch(/--text-lg:\s*clamp\(\s*18px\s*,\s*4vw\s*,\s*24px\s*\)/)
      expect(tokensContent).toMatch(/--text-display:\s*clamp\(\s*28px\s*,\s*6vw\s*,\s*56px\s*\)/)
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

  describe('Component Tokens', () => {
    it('defines component-level chip tokens', () => {
      expect(tokensContent).toContain('--chip-size')
      expect(tokensContent).toContain('var(--layout-cell)')
    })

    it('defines component-level cell tokens', () => {
      expect(tokensContent).toContain('--cell-bg-empty')
      expect(tokensContent).toContain('--cell-bg-valid')
    })
  })

  describe('Elevation & Shadow Tokens', () => {
    it('defines all elevation shadow levels (xs through xl)', () => {
      const shadows = [
        '--shadow-xs',
        '--shadow-sm',
        '--shadow-md',
        '--shadow-lg',
        '--shadow-xl',
      ]
      shadows.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })

    it('defines inner shadow tokens for inset surfaces', () => {
      const innerShadows = [
        '--shadow-inner-xs',
        '--shadow-inner-sm',
      ]
      innerShadows.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })

    it('defines glow shadow tokens for active states', () => {
      const glowShadows = [
        '--shadow-glow-accent',
        '--shadow-glow-valid',
      ]
      glowShadows.forEach((token) => {
        expect(tokensContent).toContain(token)
      })
    })

    it('shadow tokens use multi-layer syntax (comma-separated)', () => {
      const multiLayerShadows = ['--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl']
      multiLayerShadows.forEach((token) => {
        const match = tokensContent.match(new RegExp(`${token.replace(/--/, '--')}:\\s*([^;]+);`))
        expect(match).not.toBeNull()
        if (match) {
          expect(match[1].includes(',')).toBe(true)
        }
      })
    })

    it('shadow tokens use rgba for dark theme compatibility', () => {
      const shadowTokens = ['--shadow-xs', '--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl']
      shadowTokens.forEach((token) => {
        const match = tokensContent.match(new RegExp(`${token.replace(/--/, '--')}:\\s*([^;]+);`))
        expect(match).not.toBeNull()
        if (match) {
          expect(match[1]).toMatch(/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,/)
        }
      })
    })
  })

  describe('Responsive Breakpoints', () => {
    it('defines mobile breakpoint for layout-cell (max-width: 480px)', () => {
      expect(tokensContent).toContain('@media (max-width: 480px)')
      expect(tokensContent).toMatch(/@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*--layout-cell:\s*clamp\(\s*36px/)
    })

    it('defines tablet breakpoint for layout-cell (481px-768px)', () => {
      expect(tokensContent).toContain('@media (min-width: 481px) and (max-width: 768px)')
      expect(tokensContent).toMatch(/@media\s*\(min-width:\s*481px\)\s*and\s*\(max-width:\s*768px\)\s*\{[\s\S]*--layout-cell:\s*clamp\(\s*40px/)
    })

    it('defines desktop breakpoint for layout-cell (min-width: 769px)', () => {
      expect(tokensContent).toContain('@media (min-width: 769px)')
      expect(tokensContent).toMatch(/@media\s*\(min-width:\s*769px\)\s*\{[\s\S]*--layout-cell:\s*clamp\(\s*48px/)
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
