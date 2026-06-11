import fs from 'fs'
import path from 'path'
import { beforeAll, describe, expect, it } from 'vitest'

describe('Surface Textures', () => {
  const projectRoot = path.join(__dirname, '../../../../')
  const texturesPath = path.join(projectRoot, 'packages/client/src/styles/textures.css')

  let texturesContent: string

  beforeAll(() => {
    if (fs.existsSync(texturesPath)) {
      texturesContent = fs.readFileSync(texturesPath, 'utf-8')
    }
  })

  it('textures.css file exists', () => {
    expect(fs.existsSync(texturesPath)).toBe(true)
  })

  describe('Wood Grain Texture', () => {
    it('defines .texture-wood class', () => {
      expect(texturesContent).toContain('.texture-wood')
    })

    it('uses SVG feTurbulence filter for procedural noise', () => {
      expect(texturesContent).toContain('feTurbulence')
      expect(texturesContent).toContain('fractalNoise')
    })

    it('uses background-blend-mode overlay', () => {
      expect(texturesContent).toContain('background-blend-mode: overlay')
    })

    it('sets low opacity for subtle texture', () => {
      const match = texturesContent.match(/\.texture-wood[\s\S]*?opacity:\s*([\d.]+);/)
      expect(match).not.toBeNull()
      if (match) {
        const opacity = Number.parseFloat(match[1])
        expect(opacity).toBeLessThanOrEqual(0.08)
        expect(opacity).toBeGreaterThan(0)
      }
    })
  })

  describe('Felt Texture', () => {
    it('defines .texture-felt class', () => {
      expect(texturesContent).toContain('.texture-felt')
    })

    it('uses radial gradients for felt effect', () => {
      expect(texturesContent).toContain('radial-gradient')
    })
  })

  describe('Surface Gradient', () => {
    it('defines .surface-gradient-board class', () => {
      expect(texturesContent).toContain('.surface-gradient-board')
    })

    it('uses linear gradient for board surface', () => {
      expect(texturesContent).toContain('linear-gradient')
    })
  })
})
