import type { Theme } from '@town77/shared-types'
import { meetsWcagAA } from '../../lib/contrast'

/** WCAG 1.4.11 non-text contrast for graphical chip fills on cell surfaces */
const CHIP_SURFACE_MIN_RATIO = 3

const REQUIRED_SHAPES = [
  'cottage',
  'rowhouse',
  'tower',
  'victorian',
  'barn',
  'bungalow',
  'skyscraper',
] as const

const ANIMATION_KEYS = [
  'chipPlace',
  'chipInvalid',
  'chipDraw',
  'cellPulse',
  'turnIn',
  'celebrate',
] as const

export function assertValidTheme(theme: Theme): void {
  const shapeCount = Object.keys(theme.shapes).length
  if (shapeCount !== 7) {
    throw new Error(`Expected 7 shapes, got ${shapeCount}`)
  }

  for (const shape of REQUIRED_SHAPES) {
    const path = theme.shapes[shape]
    if (!path || path.trim().length === 0) {
      throw new Error(`Missing or empty shape: ${shape}`)
    }
  }

  const colorCount = Object.keys(theme.colorPalette).length
  if (colorCount !== 7) {
    throw new Error(`Expected 7 colors, got ${colorCount}`)
  }

  for (let i = 1; i <= 7; i++) {
    const colorId = `color-${i}`
    if (!theme.colorPalette[colorId]) {
      throw new Error(`Missing color: ${colorId}`)
    }
  }

  const surfaceKeys = [
    'background',
    'grid',
    'cell',
    'cellHover',
    'cellValid',
    'cellInvalid',
  ] as const
  for (const key of surfaceKeys) {
    if (!theme.surfaces[key]) {
      throw new Error(`Missing surface: ${key}`)
    }
  }

  for (const key of ANIMATION_KEYS) {
    if (!theme.animationPreset[key]) {
      throw new Error(`Missing animationPreset key: ${key}`)
    }
  }

  if (theme.animationPreset.chipPlace.type !== 'spring') {
    throw new Error('chipPlace must use spring type')
  }

  for (const hex of Object.values(theme.colorPalette)) {
    if (!meetsWcagAA(hex, theme.surfaces.cell, CHIP_SURFACE_MIN_RATIO)) {
      throw new Error(
        `Color ${hex} fails ${CHIP_SURFACE_MIN_RATIO}:1 contrast on cell ${theme.surfaces.cell}`,
      )
    }
  }
}
