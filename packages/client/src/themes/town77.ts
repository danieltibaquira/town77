import type { Theme } from '@town77/shared-types'

export const town77Theme: Theme = {
  id: 'town77',
  name: 'Town 77',
  style: 'refined',
  shapes: {
    cottage:
      'M6 36 L6 20 L10 20 L10 14 L20 4 L30 14 L30 20 L34 20 L34 36 L22 36 L22 28 L18 28 L18 36 Z',
    rowhouse:
      'M4 36 L4 18 L8 18 L8 10 L20 4 L32 10 L32 18 L36 18 L36 36 L24 36 L24 26 L16 26 L16 36 Z',
    tower:
      'M16 36 L16 12 L14 12 L14 6 L20 2 L26 6 L26 12 L24 12 L24 36 Z M18 18 L22 18 L22 22 L18 22 Z',
    victorian:
      'M4 36 L4 20 L8 20 L8 14 L14 8 L20 4 L26 8 L32 14 L32 20 L36 20 L36 36 L26 36 L26 28 L22 28 L22 36 L18 36 L18 28 L14 28 L14 36 Z',
    barn: 'M4 36 L4 20 Q20 6 36 20 L36 36 L26 36 L26 28 L14 28 L14 36 Z',
    bungalow:
      'M4 36 L4 22 L8 22 L8 16 L20 6 L32 16 L32 22 L36 22 L36 36 L24 36 L24 28 L16 28 L16 36 Z',
    skyscraper:
      'M14 36 L14 10 L12 10 L12 4 L20 2 L28 4 L28 10 L26 10 L26 36 Z M16 14 L24 14 L24 18 L16 18 Z M16 22 L24 22 L24 26 L16 26 Z',
  },
  colorPalette: {
    'color-1': '#dc2626',
    'color-2': '#2563eb',
    'color-3': '#059669',
    'color-4': '#f59e0b',
    'color-5': '#db2777',
    'color-6': '#4f46e5',
    'color-7': '#ea580c',
  },
  surfaces: {
    background: '#020617',
    grid: '#0f172a',
    cell: '#1e293b',
    cellHover: '#334155',
    cellValid: '#065f46',
    cellInvalid: '#7f1d1d',
  },
  fonts: {
    display: "'Bebas Neue', sans-serif",
    ui: "'Inter', system-ui, sans-serif",
  },
  animationPreset: {
    chipPlace: { type: 'spring', stiffness: 260, damping: 20, mass: 1 },
    chipInvalid: { x: [-6, 6, -4, 4, 0], duration: 0.3 },
    chipDraw: { duration: 0.25, ease: 'easeOut' },
    cellPulse: { duration: 0.6, repeat: 1 },
    turnIn: { duration: 0.4, ease: 'easeOut' },
    celebrate: { duration: 1.2, particleCount: 60, spread: 100 },
    chipDrawIn: { duration: 0.35, stagger: 0.04, ease: 'easeOut' },
    placementRipple: { duration: 0.6, maxScale: 2.5, ease: 'easeOut' },
    turnSweep: { duration: 0.5, ease: 'easeOut' },
    scorePop: { type: 'spring', stiffness: 300, damping: 12, mass: 0.8 },
    bagShake: { x: [-3, 3, -2, 2, -1, 1, 0], duration: 0.4 },
    hoverLift: { duration: 0.2, scale: 1.05, ease: 'easeOut' },
    handReorder: { duration: 0.3, ease: 'easeOut' },
    badgeGlowPulse: { duration: 1.5, minOpacity: 0.3, maxOpacity: 0.8 },
    exchangeFlash: { duration: 0.15, opacity: 0.5 },
    discardFade: { duration: 0.25, endScale: 0.8, ease: 'easeOut' },
    cellEntrance: { duration: 0.3, stagger: 0.02, ease: 'easeOut' },
    errorShake: { x: [-8, 8, -6, 6, -4, 4, -2, 2, 0], duration: 0.4, borderFlash: true },
  },
  styleProps: {
    borderWidth: 0,
    shadowOffset: 0,
    shadowColor: 'transparent',
    borderRadius: 8,
    borderColor: 'transparent',
  },
}
