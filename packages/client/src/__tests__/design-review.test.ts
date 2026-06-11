import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Design Review & Case Studies', () => {
  const projectRoot = path.join(__dirname, '../../../../')
  const specPath = path.join(projectRoot, 'docs/design-system/spec-theme-and-voice.md')

  let specContent: string

  beforeAll(() => {
    if (fs.existsSync(specPath)) {
      specContent = fs.readFileSync(specPath, 'utf-8')
    }
  })

  describe('Section 10: Town77 Case Study', () => {
    it('spec section 10 documents town77 theme case study', () => {
      expect(specContent).toContain('## 10. Case Study: Town 77 Theme')
    })

    it('spec documents color palette with rationale', () => {
      expect(specContent).toContain('Color Palette')
      expect(specContent).toContain('Terracotta')
      expect(specContent).toContain('Slate Blue')
      expect(specContent).toContain('Forest')
    })

    it('spec documents all 7 architectural shapes', () => {
      const shapes = ['Cottage', 'Rowhouse', 'Tower', 'Victorian', 'Barn', 'Bungalow', 'Skyscraper']
      shapes.forEach((shape) => {
        expect(specContent).toContain(shape)
      })
    })

    it('spec explains barn shape hand-craft technique', () => {
      expect(specContent).toContain('Barn')
      expect(specContent).toContain('Bezier')
      expect(specContent).toContain('hand-drawn')
    })

    it('spec documents motion preset rationale', () => {
      expect(specContent).toContain('Motion Preset')
      expect(specContent).toContain('spring')
      expect(specContent).toContain('chipPlace')
    })

    it('spec documents accessibility compliance', () => {
      expect(specContent).toContain('Accessibility Compliance')
      expect(specContent).toContain('WCAG AA')
      expect(specContent).toContain('prefers-reduced-motion')
    })

    it('spec includes lessons and reusability section', () => {
      expect(specContent).toContain('Lessons & Reusability')
      expect(specContent).toContain('What works')
      expect(specContent).toContain('theme-specific')
    })
  })

  describe('Section 11: Design Review Checklist', () => {
    it('spec section 11 documents design review checklist', () => {
      expect(specContent).toContain('## 11. Design Review Checklist & Accessibility')
    })

    it('spec includes visual QA checklist items', () => {
      expect(specContent).toContain('Visual QA')
      expect(specContent).toContain('renders across all components')
      expect(specContent).toContain('cohesive')
    })

    it('spec includes accessibility checklist items', () => {
      expect(specContent).toContain('Accessibility Compliance')
      expect(specContent).toContain('Keyboard navigation')
      expect(specContent).toContain('Screen reader')
      expect(specContent).toContain('Color contrast')
      expect(specContent).toContain('prefers-reduced-motion')
    })

    it('spec includes design system adherence checklist', () => {
      expect(specContent).toContain('Design System Adherence')
      expect(specContent).toContain('Tokens only')
      expect(specContent).toContain('7 shapes, 7 colors')
      expect(specContent).toContain('SVG paths valid')
    })

    it('spec includes anti-pattern catches checklist', () => {
      expect(specContent).toContain('Anti-Pattern Catches')
      expect(specContent).toContain('No procedural symmetry')
      expect(specContent).toContain('No generic easing')
      expect(specContent).toContain('No stock icons')
      expect(specContent).toContain('No inline styles')
    })

    it('spec includes reviewer responsibilities', () => {
      expect(specContent).toContain('Reviewer Responsibilities')
      expect(specContent).toContain('Designer')
      expect(specContent).toContain('Frontend Engineer')
      expect(specContent).toContain('Accessibility')
    })

    it('spec includes example of town77 passing review', () => {
      expect(specContent).toContain('Example: Town 77 Design Review')
      expect(specContent).toContain('Ready to merge')
    })
  })
})
