import type { Theme } from "@town77/shared-types"

/**
 * Playful Pastel Theme
 *
 * A bright, cheerful contrast to Town 77's earthy palette.
 * Emphasizes spring animation and celebration, with soft pastels.
 *
 * Design philosophy:
 * - Soft, playful colors that feel friendly and approachable
 * - Simplified geometric shapes (no hand-drawn curves)
 * - Energetic spring animations with bounce
 * - Celebration-focused (more particles, brighter feedback)
 */

export const playfulPastelTheme: Theme = {
  id: "playful-pastel",
  name: "Playful Pastel",
  style: "refined",

  // Geometric shapes: simplified, no curves
  shapes: {
    cottage: "M5 35 L5 20 L20 5 L35 20 L35 35 Z",
    rowhouse: "M8 35 L8 16 L20 5 L32 16 L32 35 Z",
    tower: "M15 35 L15 10 L20 5 L25 10 L25 35 Z",
    victorian: "M5 35 L5 22 L12 12 L20 3 L28 12 L35 22 L35 35 Z",
    barn: "M5 35 L5 22 L20 10 L35 22 L35 35 Z", // Simplified triangular roof (no curve)
    bungalow: "M3 35 L3 24 L10 17 L30 17 L37 24 L37 35 Z",
    skyscraper: "M15 35 L15 5 L20 2 L25 5 L25 35 Z", // Simpler tower
  },

  // Pastel palette: soft, desaturated, playful colors
  colorPalette: {
    "color-1": "#FF6B9D",
    "color-2": "#81D4FA",
    "color-3": "#B39DDB",
    "color-4": "#F48FB1",
    "color-5": "#69F0AE",
    "color-6": "#FFB74D",
    "color-7": "#FF8A80",
  },

  surfaces: {
    background: "#FFF8F3",
    grid: "#F0E0D8",
    cell: "#2A2420",
    cellHover: "#3A322C",
    cellValid: "#2F4A35",
    cellInvalid: "#5A3030",
  },

  fonts: {
    display: "'Fredoka One', sans-serif", // Playful rounded font
    ui: "'Poppins', system-ui, sans-serif", // Modern, friendly UI font
  },

  // Playful motion: more bounce, faster feedback
  animationPreset: {
    chipPlace: { type: "spring", stiffness: 300, damping: 15, mass: 0.9 },
    chipInvalid: { x: [-8, 8, -6, 6, -4, 4, 0], duration: 0.2 },
    chipDraw: { duration: 0.2, ease: "easeOut" },
    cellPulse: { duration: 0.4, repeat: 2 },
    turnIn: { duration: 0.25, ease: "easeOut" },
    celebrate: { duration: 1.0, particleCount: 100, spread: 150 },
    chipDrawIn: { duration: 0.28, stagger: 0.05, ease: "easeOut" },
    placementRipple: { duration: 0.5, maxScale: 3, ease: "easeOut" },
    turnSweep: { duration: 0.35, ease: "easeOut" },
    scorePop: { type: "spring", stiffness: 350, damping: 10, mass: 0.7 },
    bagShake: { x: [-4, 4, -3, 3, -2, 2, 0], duration: 0.35 },
    hoverLift: { duration: 0.15, scale: 1.08, ease: "easeOut" },
    handReorder: { duration: 0.25, ease: "easeOut" },
    badgeGlowPulse: { duration: 1.2, minOpacity: 0.4, maxOpacity: 0.9 },
    exchangeFlash: { duration: 0.12, opacity: 0.6 },
    discardFade: { duration: 0.2, endScale: 0.75, ease: "easeOut" },
    cellEntrance: { duration: 0.25, stagger: 0.025, ease: "easeOut" },
    errorShake: { x: [-10, 10, -8, 8, -6, 6, -4, 4, -2, 2, 0], duration: 0.3, borderFlash: true },
  },
  styleProps: {
    borderWidth: 0,
    shadowOffset: 0,
    shadowColor: "transparent",
    borderRadius: 8,
    borderColor: "transparent",
  },
}
