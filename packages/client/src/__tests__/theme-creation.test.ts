import fs from 'fs'
import path from 'path'
import { beforeAll, describe, expect, it } from 'vitest'

describe('Implementation Guide - Creating a New Theme', () => {
  const projectRoot = path.join(__dirname, '../../../../')
  const specPath = path.join(projectRoot, 'docs/design-system/spec-theme-and-voice.md')
  const templatePath = path.join(projectRoot, 'packages/client/src/themes/_template.ts')

  let specContent: string

  beforeAll(() => {
    if (fs.existsSync(specPath)) {
      specContent = fs.readFileSync(specPath, 'utf-8')
    }
  })

  describe('Section 9: Implementation Guide', () => {
    it('spec section 9 documents step-by-step theme creation', () => {
      expect(specContent).toContain('## 9. Creating a New Theme — Step by Step')
    })

    it('spec documents prerequisites (SVG, contrast checker)', () => {
      expect(specContent).toContain('Prerequisites')
      expect(specContent).toContain('SVG knowledge')
      expect(specContent).toContain('webaim.org')
    })

    it('spec documents Step 1: Copy template', () => {
      expect(specContent).toContain('Step 1: Copy the Theme Template')
      expect(specContent).toContain('_template.ts')
    })

    it('spec documents Step 2: Define metadata', () => {
      expect(specContent).toContain('Step 2: Define Metadata')
      expect(specContent).toContain('id:')
      expect(specContent).toContain('name:')
    })

    it('spec documents Step 3: Author 7 SVG shapes', () => {
      expect(specContent).toContain('Step 3: Author 7 SVG Shapes')
      expect(specContent).toContain('shapes: {')
      expect(specContent).toContain('cottage')
      expect(specContent).toContain('rowhouse')
      expect(specContent).toContain('tower')
    })

    it('spec documents Step 4: Curate 7-color palette', () => {
      expect(specContent).toContain('Step 4: Curate a 7-Color Palette')
      expect(specContent).toContain('colorPalette')
      expect(specContent).toContain('color-1')
      expect(specContent).toContain('color-7')
    })

    it('spec documents Step 5: Define motion preset', () => {
      expect(specContent).toContain('Step 5: Define Motion Preset')
      expect(specContent).toContain('animationPreset')
      expect(specContent).toContain('chipPlace')
      expect(specContent).toContain('celebrate')
    })

    it('spec documents Step 6: Define surfaces and fonts', () => {
      expect(specContent).toContain('Step 6: Define Surfaces & Fonts')
      expect(specContent).toContain('surfaces')
      expect(specContent).toContain('fonts')
    })

    it('spec documents Step 7: Register theme in index.ts', () => {
      expect(specContent).toContain('Step 7: Register Theme')
      expect(specContent).toContain('themes/index.ts')
      expect(specContent).toContain('THEMES')
    })

    it('spec documents Step 8: Write tests', () => {
      expect(specContent).toContain('Step 8: Write Tests')
      expect(specContent).toContain('theme.test.ts')
      expect(specContent).toContain('is a valid Theme object')
    })

    it('spec includes example test code (theme validation)', () => {
      expect(specContent).toContain('toHaveLength(7)')
      expect(specContent).toContain('myTheme')
    })

    it('spec explains animation preset validation in tests', () => {
      expect(specContent).toContain('animationPreset.chipPlace.type')
      expect(specContent).toContain('animationPreset.chipPlace.stiffness')
    })
  })

  describe('Theme Template File', () => {
    it('template file exists', () => {
      expect(fs.existsSync(templatePath)).toBe(true)
    })

    it('template is valid TypeScript', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      expect(templateContent).toContain('Theme')
      expect(templateContent).toContain('export')
    })

    it('template exports a theme object', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      expect(templateContent).toMatch(/export\s+(const|let)\s+\w+Theme.*:.*Theme/)
    })

    it('template includes all required theme fields', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      expect(templateContent).toContain('id:')
      expect(templateContent).toContain('name:')
      expect(templateContent).toContain('shapes:')
      expect(templateContent).toContain('colorPalette:')
      expect(templateContent).toContain('surfaces:')
      expect(templateContent).toContain('fonts:')
      expect(templateContent).toContain('animationPreset:')
    })

    it('template shapes include all 7 types', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      const shapeNames = [
        'cottage',
        'rowhouse',
        'tower',
        'victorian',
        'barn',
        'bungalow',
        'skyscraper',
      ]
      shapeNames.forEach((shape) => {
        expect(templateContent).toContain(shape)
      })
    })

    it('template defines 7 colors', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      for (let i = 1; i <= 7; i++) {
        expect(templateContent).toContain(`"color-${i}"`)
      }
    })

    it('template includes animation preset examples', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      expect(templateContent).toContain('chipPlace')
      expect(templateContent).toContain('chipInvalid')
      expect(templateContent).toContain('chipDraw')
      expect(templateContent).toContain('cellPulse')
      expect(templateContent).toContain('turnIn')
      expect(templateContent).toContain('celebrate')
    })
  })
})
