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

  // Silhouettes traced from the physical Town 77 tiles. viewBox 0 0 40 40.
  shapes: {
    cottage: "M9 37 L9 17 L20 6 L31 17 L31 37 Z",
    rowhouse: "M7 14 L33 14 L33 37 Q29.5 32 26 37 Q22.5 32 19 37 Q15.5 32 12 37 Q8.5 32 7 37 Z",
    tower: "M8 37 L8 8 L17 8 L17 19 A3.2 3.2 0 0 0 23 19 L23 8 L32 8 L32 37 Z",
    victorian: "M6 37 L6 17 L13 7 L20 17 L27 7 L34 17 L34 37 Z",
    barn: "M8 37 L8 17 L12 9 L16 17 L20 9 L24 17 L28 9 L32 17 L32 37 Z",
    bungalow: "M7 37 L7 14 L8 14 L8 9 L13 9 L13 14 L17 14 L17 9 L23 9 L23 14 L27 14 L27 9 L32 9 L32 14 L33 14 L33 37 Z",
    skyscraper: "M11 37 L11 16 L15 16 L15 11 L18 11 L18 6 L22 6 L22 11 L25 11 L25 16 L29 16 L29 37 Z",
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
