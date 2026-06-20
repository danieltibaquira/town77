import type { ColorId, ShapeId } from './chip'

export interface SpringConfig {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
}

export interface ChipDrawInConfig {
  duration: number
  stagger: number
  ease: string
}

export interface PlacementRippleConfig {
  duration: number
  maxScale: number
  ease: string
}

export interface TurnSweepConfig {
  duration: number
  ease: string
}

export interface BagShakeConfig {
  x: number[]
  duration: number
}

export interface HoverLiftConfig {
  duration: number
  scale: number
  ease: string
}

export interface HandReorderConfig {
  duration: number
  ease: string
}

export interface BadgeGlowPulseConfig {
  duration: number
  minOpacity: number
  maxOpacity: number
}

export interface ExchangeFlashConfig {
  duration: number
  opacity: number
}

export interface DiscardFadeConfig {
  duration: number
  endScale: number
  ease: string
}

export interface CellEntranceConfig {
  duration: number
  stagger: number
  ease: string
}

export interface ErrorShakeConfig {
  x: number[]
  duration: number
  borderFlash: boolean
}

export interface AnimationPreset {
  chipPlace: SpringConfig
  chipInvalid: { x: number[]; duration: number }
  chipDraw: { duration: number; ease: string }
  cellPulse: { duration: number; repeat: number }
  turnIn: { duration: number; ease: string }
  celebrate: { duration: number; particleCount: number; spread: number }

  chipDrawIn: ChipDrawInConfig
  placementRipple: PlacementRippleConfig
  turnSweep: TurnSweepConfig
  scorePop: SpringConfig
  bagShake: BagShakeConfig
  hoverLift: HoverLiftConfig
  handReorder: HandReorderConfig
  badgeGlowPulse: BadgeGlowPulseConfig
  exchangeFlash: ExchangeFlashConfig
  discardFade: DiscardFadeConfig
  cellEntrance: CellEntranceConfig
  errorShake: ErrorShakeConfig
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

export type ThemeStyle = "refined" | "neobrutalism"

export interface ThemeStyleProps {
  borderWidth: number
  shadowOffset: number
  shadowColor: string
  borderRadius: number
  borderColor: string
}

export interface Theme {
  id: string
  name: string
  style: ThemeStyle
  shapes: Record<ShapeId, string>
  colorPalette: Record<ColorId, string>
  surfaces: ThemeSurfaces
  fonts: ThemeFonts
  animationPreset: AnimationPreset
  styleProps: ThemeStyleProps
}
