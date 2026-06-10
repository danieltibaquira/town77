import type { Theme } from "@town77/shared-types";

export const town77Theme: Theme = {
  id: "town77",
  name: "Town 77",
  shapes: {
    cottage: "M5 35 L5 20 L20 5 L35 20 L35 35 Z",
    rowhouse: "M8 35 L8 16 L20 5 L32 16 L32 35 Z",
    tower: "M13 35 L13 3 L16 1 L24 1 L27 3 L27 35 Z",
    victorian: "M5 35 L5 22 L12 12 L20 3 L28 12 L35 22 L35 35 Z",
    barn: "M4 35 L4 20 Q20 8 36 20 L36 35 Z",
    bungalow: "M3 35 L3 24 L10 17 L30 17 L37 24 L37 35 Z",
    skyscraper: "M13 35 L13 2 L20 0 L27 2 L27 35 Z",
  },
  colorPalette: {
    "color-1": "#B04A2F",
    "color-2": "#3D7AB5",
    "color-3": "#4A7C59",
    "color-4": "#C4A35A",
    "color-5": "#8B3A52",
    "color-6": "#2B2F5E",
    "color-7": "#E8D5B0",
  },
  surfaces: {
    background: "#0F0D17",
    grid: "#1C1828",
    cell: "#241F35",
    cellHover: "#2E2847",
    cellValid: "#2C4A2E",
    cellInvalid: "#4A2020",
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
  },
};
