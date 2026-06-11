import fs from 'fs'
import path from 'path'
import { beforeAll, describe, expect, it } from 'vitest'

describe('Component Variants Reference', () => {
  const projectRoot = path.join(__dirname, '../../../../')
  const specPath = path.join(projectRoot, 'docs/design-system/spec-theme-and-voice.md')

  let specContent: string

  beforeAll(() => {
    if (fs.existsSync(specPath)) {
      specContent = fs.readFileSync(specPath, 'utf-8')
    }
  })

  describe('Section 8: Component API Reference', () => {
    it('spec section 8 documents component variants', () => {
      expect(specContent).toContain('## 8. Component API Reference')
    })

    it('spec mandates CSS-token-driven variants (no hardcoded colors)', () => {
      expect(specContent).toContain('CSS-token-driven')
      expect(specContent).toContain('no hardcoded colors')
    })
  })

  describe('Chip Component Variants', () => {
    it('spec documents Chip component props and variants', () => {
      expect(specContent).toContain('### Chip Component')
      expect(specContent).toContain('interface ChipProps')
    })

    it('spec documents Chip size variants (sm, md, lg)', () => {
      expect(specContent).toContain("size?: 'sm' | 'md' | 'lg'")
      expect(specContent).toContain('60% of')
      expect(specContent).toContain('100% of')
      expect(specContent).toContain('140% of')
    })

    it('spec documents Chip visual variants (flat, outline)', () => {
      expect(specContent).toContain("variant?: 'flat' | 'outline'")
      expect(specContent).toContain('flat')
      expect(specContent).toContain('outline')
      expect(specContent).toContain('no stroke')
      expect(specContent).toContain('solid fill')
      expect(specContent).toContain('stroke only')
    })

    it('spec documents Chip CSS rendering for variants', () => {
      expect(specContent).toContain('data-size')
      expect(specContent).toContain('data-variant')
      expect(specContent).toContain('--layout-cell')
    })
  })

  describe('Cell Component Variants', () => {
    it('spec documents Cell component props and variants', () => {
      expect(specContent).toContain('### Cell Component')
      expect(specContent).toContain('interface CellProps')
    })

    it('spec documents Cell density variants (compact, comfortable)', () => {
      expect(specContent).toContain("density?: 'compact' | 'comfortable'")
      expect(specContent).toContain('compact')
      expect(specContent).toContain('comfortable')
    })

    it('spec documents Cell highlight style variants (glow, pulse)', () => {
      expect(specContent).toContain("highlightStyle?: 'glow' | 'pulse'")
      expect(specContent).toContain('glow')
      expect(specContent).toContain('pulse')
      expect(specContent).toContain('shadow')
      expect(specContent).toContain('animation')
    })

    it('spec documents density mapping using tokens', () => {
      expect(specContent).toContain('--layout-gap')
    })
  })

  describe('Grid Component Variants', () => {
    it('spec documents Grid component and props', () => {
      expect(specContent).toContain('### Grid Component')
      expect(specContent).toContain('interface GridProps')
    })

    it('spec documents Grid density propagation to cells', () => {
      expect(specContent).toContain("density?: 'compact' | 'comfortable'")
      expect(specContent).toContain('Propagates to Cells')
    })
  })

  describe('Hand Component Variants', () => {
    it('spec documents Hand component and layout modes', () => {
      expect(specContent).toContain('### Hand Component')
      expect(specContent).toContain('interface HandProps')
    })

    it('spec documents Hand layout mode variants (scrolling, stacked, compact)', () => {
      expect(specContent).toContain("layoutMode?: 'scrolling' | 'stacked' | 'compact'")
      expect(specContent).toContain('scrolling')
      expect(specContent).toContain('stacked')
      expect(specContent).toContain('compact')
    })

    it('spec documents layout mode CSS properties', () => {
      expect(specContent).toContain('overflow-x: auto')
      expect(specContent).toContain('flex-wrap: wrap')
    })
  })

  describe('ActionBar Component Variants', () => {
    it('spec documents ActionBar component and props', () => {
      expect(specContent).toContain('### ActionBar Component')
      expect(specContent).toContain('interface ActionBarProps')
    })

    it('spec documents ActionBar size variants (sm, md)', () => {
      expect(specContent).toContain("size?: 'sm' | 'md'")
      expect(specContent).toContain('32px')
      expect(specContent).toContain('48px')
    })

    it('spec documents ActionBar visual variants (raised, ghost)', () => {
      expect(specContent).toContain("variant?: 'raised' | 'ghost'")
      expect(specContent).toContain('raised')
      expect(specContent).toContain('ghost')
      expect(specContent).toContain('solid')
      expect(specContent).toContain('shadow')
      expect(specContent).toContain('transparent')
      expect(specContent).toContain('border')
    })

    it('spec documents ActionBar iconOnly option', () => {
      expect(specContent).toContain('iconOnly?: boolean')
    })
  })

  describe('PlayerBadge Component', () => {
    it('spec documents PlayerBadge component', () => {
      expect(specContent).toMatch(/PlayerBadge|player badge/i)
    })
  })

  describe('Component API Consistency', () => {
    it('spec documents that all variants use CSS tokens', () => {
      expect(specContent).toContain('CSS-token-driven')
    })

    it('spec documents rendering patterns with CSS custom properties', () => {
      expect(specContent).toContain('var(--')
      expect(specContent).toContain('data-size')
      expect(specContent).toContain('data-variant')
    })

    it('spec mentions no hardcoding colors in components', () => {
      expect(specContent).toContain('no hardcoded colors')
    })
  })
})
