import fs from 'fs'
import path from 'path'
import { beforeAll, describe, expect, it } from 'vitest'

describe('ChipDefs Component', () => {
  const projectRoot = path.join(__dirname, '../../../../')
  const chipDefsPath = path.join(projectRoot, 'packages/client/src/components/ChipDefs.tsx')

  let chipDefsContent: string

  beforeAll(() => {
    if (fs.existsSync(chipDefsPath)) {
      chipDefsContent = fs.readFileSync(chipDefsPath, 'utf-8')
    }
  })

  it('ChipDefs.tsx file exists', () => {
    expect(fs.existsSync(chipDefsPath)).toBe(true)
  })

  describe('SVG Defs Structure', () => {
    it('renders SVG with width/height 0 and absolute positioning', () => {
      expect(chipDefsContent).toContain('<svg')
      expect(chipDefsContent).toContain('width="0"')
      expect(chipDefsContent).toContain('height="0"')
      expect(chipDefsContent).toContain("position: 'absolute'")
    })

    it('contains <defs> block for shared definitions', () => {
      expect(chipDefsContent).toContain('<defs>')
      expect(chipDefsContent).toContain('</defs>')
    })
  })

  describe('Chip Color Gradients', () => {
    it('defines linear gradients for all 7 chip colors', () => {
      expect(chipDefsContent).toContain('chip-grad-')
      expect(chipDefsContent).toContain('index + 1')
    })

    it('each gradient has 3 stops (lighter → base → darker)', () => {
      // Gradients are generated via .map() with 3 stops each
      expect(chipDefsContent).toContain('offset="0%"')
      expect(chipDefsContent).toContain('offset="50%"')
      expect(chipDefsContent).toContain('offset="100%"')
      expect(chipDefsContent).toContain('stopColor={lighter}')
      expect(chipDefsContent).toContain('stopColor={color}')
      expect(chipDefsContent).toContain('stopColor={darker}')
    })

    it('gradient stops use offset 0%, 50%, 100%', () => {
      expect(chipDefsContent).toContain('offset="0%"')
      expect(chipDefsContent).toContain('offset="50%"')
      expect(chipDefsContent).toContain('offset="100%"')
    })
  })

  describe('Shadow Filter', () => {
    it('defines drop shadow filter for chips', () => {
      expect(chipDefsContent).toContain('id="chip-shadow"')
      expect(chipDefsContent).toContain('feDropShadow')
    })

    it('shadow uses dark rgba for theme compatibility', () => {
      expect(chipDefsContent).toMatch(/floodOpacity="0\.\d+"/)
    })
  })

  describe('Specular Highlight', () => {
    it('defines radial gradient for specular sheen', () => {
      expect(chipDefsContent).toContain('id="chip-sheen"')
      expect(chipDefsContent).toContain('radialGradient')
    })
  })

  describe('Theme Integration', () => {
    it('reads chip colors from theme via useTheme hook', () => {
      expect(chipDefsContent).toContain('useTheme')
      expect(chipDefsContent).toContain('theme.colorPalette')
    })

    it('exports ChipDefs as named component', () => {
      expect(chipDefsContent).toContain('export function ChipDefs')
    })
  })
})
