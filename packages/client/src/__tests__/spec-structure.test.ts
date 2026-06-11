import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

describe('Design System Spec Structure', () => {
  const specPath = path.join(__dirname, '../../../..', 'docs/design-system/spec-theme-and-voice.md')

  it('spec document exists', () => {
    expect(fs.existsSync(specPath)).toBe(true)
  })

  it('contains all 11 required sections', () => {
    const content = fs.readFileSync(specPath, 'utf-8')
    const sections = [
      '## 1. Purpose & Scope',
      '## 2. Principles',
      '## 3. Token Hierarchy',
      '## 4. Token Naming Conventions',
      '## 5. Animation Presets & Motion Personalities',
      '## 6. Sound & Particle Assets',
      '## 7. Asset Guidelines & Shapes',
      '## 8. Component API Reference',
      '## 9. Creating a New Theme — Step by Step',
      '## 10. Case Study: Town 77 Theme',
      '## 11. Design Review Checklist & Accessibility',
    ]
    sections.forEach((section) => {
      expect(content).toContain(section)
    })
  })

  it('defines core principles: constrain-then-customize, intentional imperfection, motion-as-identity, accessibility, human-in-loop', () => {
    const content = fs.readFileSync(specPath, 'utf-8')
    const principles = [
      'constrain',
      'customize',
      'imperfection',
      'motion',
      'accessibility',
      'human',
    ]
    principles.forEach((principle) => {
      expect(content.toLowerCase()).toContain(principle)
    })
  })

  it('does not reference non-existent files', () => {
    const content = fs.readFileSync(specPath, 'utf-8')
    const links = content.match(/\]\(([^)]+)\)/g) || []
    links.forEach((link) => {
      const filePath = link.slice(2, -1)
      if (filePath.startsWith('http')) return
      if (filePath.startsWith('#')) return
      const fullPath = path.join(path.dirname(specPath), filePath)
      expect(fs.existsSync(fullPath)).toBe(true)
    })
  })
})
