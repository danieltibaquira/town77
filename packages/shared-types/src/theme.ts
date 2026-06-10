import type { ColorId, ShapeId } from './chip'

export interface SpringConfig {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
}

export interface AnimationPreset {
  chipPlace: SpringConfig
  chipInvalid: { x: number[]; duration: number }
  chipDraw: { duration: number; ease: string }
  cellPulse: { duration: number; repeat: number }
  turnIn: { duration: number; ease: string }
  celebrate: { duration: number; particleCount: number; spread: number }
}

export interface ThemeSurfaces {
  background: string
  grid: string
  cell: string
  cellHover: string
  cellValid: string
  cellInvalid: string
}

export interface ThemeFonts {
  display: string
  ui: string
}

export interface Theme {
  id: string
  name: string
  shapes: Record<ShapeId, string>
  colorPalette: Record<ColorId, string>
  surfaces: ThemeSurfaces
  fonts: ThemeFonts
  animationPreset: AnimationPreset
}
