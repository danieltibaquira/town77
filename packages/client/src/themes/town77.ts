import type { Theme } from "@town77/shared-types";

export const town77Theme: Theme = {
  id: "town77",
  name: "Town 77",
  style: "refined",
  // Silhouettes traced from the physical Town 77 tiles (peaked house, U-notch
  // twin tower, twin-peak crown, sawtooth, crenellated battlement, stepped
  // ziggurat, arched/scalloped base). viewBox 0 0 40 40.
  shapes: {
    cottage: "M9 37 L9 17 L20 6 L31 17 L31 37 Z",
    rowhouse: "M7 14 L33 14 L33 37 Q29.5 32 26 37 Q22.5 32 19 37 Q15.5 32 12 37 Q8.5 32 7 37 Z",
    tower: "M8 37 L8 8 L17 8 L17 19 A3.2 3.2 0 0 0 23 19 L23 8 L32 8 L32 37 Z",
    victorian: "M6 37 L6 17 L13 7 L20 17 L27 7 L34 17 L34 37 Z",
    barn: "M8 37 L8 17 L12 9 L16 17 L20 9 L24 17 L28 9 L32 17 L32 37 Z",
    bungalow: "M7 37 L7 14 L8 14 L8 9 L13 9 L13 14 L17 14 L17 9 L23 9 L23 14 L27 14 L27 9 L32 9 L32 14 L33 14 L33 37 Z",
    skyscraper: "M11 37 L11 16 L15 16 L15 11 L18 11 L18 6 L22 6 L22 11 L25 11 L25 16 L29 16 L29 37 Z",
  },
  colorPalette: {
    "color-1": "#D4623A",
    "color-2": "#E8A04C",
    "color-3": "#D9B44A",
    "color-4": "#9DB068",
    "color-5": "#E08A6A",
    "color-6": "#C2956A",
    "color-7": "#E8D5B0",
  },
  surfaces: {
    background: "#0F0D17",
    grid: "#1C1828",
    cell: "#241B12",
    cellHover: "#3A2E22",
    cellValid: "#3A4A2E",
    cellInvalid: "#4A2A22",
  },
  fonts: {
    display: "'Bebas Neue', sans-serif",
    ui: "'Inter', system-ui, sans-serif",
  },
  animationPreset: {
    chipPlace: { type: "spring", stiffness: 260, damping: 20, mass: 1 },
    chipInvalid: { x: [-6, 6, -4, 4, 0], duration: 0.3 },
    chipDraw: { duration: 0.25, ease: "easeOut" },
    cellPulse: { duration: 0.6, repeat: 1 },
    turnIn: { duration: 0.4, ease: "easeOut" },
    celebrate: { duration: 1.2, particleCount: 60, spread: 100 },
    chipDrawIn: { duration: 0.35, stagger: 0.04, ease: "easeOut" },
    placementRipple: { duration: 0.6, maxScale: 2.5, ease: "easeOut" },
    turnSweep: { duration: 0.5, ease: "easeOut" },
    scorePop: { type: "spring", stiffness: 300, damping: 12, mass: 0.8 },
    bagShake: { x: [-3, 3, -2, 2, -1, 1, 0], duration: 0.4 },
    hoverLift: { duration: 0.2, scale: 1.05, ease: "easeOut" },
    handReorder: { duration: 0.3, ease: "easeOut" },
    badgeGlowPulse: { duration: 1.5, minOpacity: 0.3, maxOpacity: 0.8 },
    exchangeFlash: { duration: 0.15, opacity: 0.5 },
    discardFade: { duration: 0.25, endScale: 0.8, ease: "easeOut" },
    cellEntrance: { duration: 0.3, stagger: 0.02, ease: "easeOut" },
    errorShake: { x: [-8, 8, -6, 6, -4, 4, -2, 2, 0], duration: 0.4, borderFlash: true },
  },
  styleProps: {
    borderWidth: 0,
    shadowOffset: 0,
    shadowColor: "transparent",
    borderRadius: 8,
    borderColor: "transparent",
  },
};
