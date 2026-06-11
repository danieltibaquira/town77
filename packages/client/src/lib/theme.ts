import type { Theme } from '@town77/shared-types'
import { createContext, useContext } from 'react'
import { getThemeById } from '../themes'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: getThemeById('town77'),
  setTheme: () => {},
})

const DEFAULT_TEXT = {
  primary: '#F0EAD6',
  secondary: '#9B92A8',
  accent: '#C4A35A',
} as const

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

export function injectTokens(theme: Theme): void {
  const root = document.documentElement
  const style = root.style

  root.setAttribute('data-theme', theme.id)

  style.setProperty('--color-surface-bg', theme.surfaces.background)
  style.setProperty('--color-surface-grid', theme.surfaces.grid)
  style.setProperty('--color-surface-cell', theme.surfaces.cell)
  style.setProperty('--color-surface-cell-hover', theme.surfaces.cellHover)
  style.setProperty('--color-surface-cell-valid', theme.surfaces.cellValid)
  style.setProperty('--color-surface-cell-invalid', theme.surfaces.cellInvalid)
  style.setProperty('--font-display', theme.fonts.display)
  style.setProperty('--font-ui', theme.fonts.ui)

  for (const [colorId, hex] of Object.entries(theme.colorPalette)) {
    style.setProperty(`--chip-${colorId}`, hex)
  }

  const isNeo = theme.style === 'neobrutalism'
  style.setProperty('--color-text-primary', isNeo ? '#000000' : DEFAULT_TEXT.primary)
  style.setProperty('--color-text-secondary', isNeo ? '#333333' : DEFAULT_TEXT.secondary)
  style.setProperty('--color-text-accent', isNeo ? '#ff6b6b' : DEFAULT_TEXT.accent)

  const { styleProps } = theme
  style.setProperty('--neo-border-width', `${styleProps.borderWidth}px`)
  style.setProperty('--neo-border-color', styleProps.borderColor)
  style.setProperty('--neo-shadow-offset', `${styleProps.shadowOffset}px`)
  style.setProperty('--neo-shadow-color', styleProps.shadowColor)
  style.setProperty('--neo-radius', `${styleProps.borderRadius}px`)

  const { animationPreset } = theme
  style.setProperty('--motion-chip-place-stiffness', String(animationPreset.chipPlace.stiffness))
  style.setProperty('--motion-chip-place-damping', String(animationPreset.chipPlace.damping))
  style.setProperty('--motion-chip-invalid-duration', String(animationPreset.chipInvalid.duration))
  style.setProperty('--motion-draw-duration', String(animationPreset.chipDraw.duration))
  style.setProperty('--motion-celebrate-duration', String(animationPreset.celebrate.duration))
}
