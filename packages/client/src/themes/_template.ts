import type { Theme } from '@town77/shared-types'

/**
 * TEMPLATE: Use this file as a starting point for creating a new theme.
 *
 * Follow the steps in docs/design-system/spec-theme-and-voice.md section 9
 * to complete your theme.
 *
 * Instructions:
 * 1. Copy this file: cp src/themes/_template.ts src/themes/my-theme.ts
 * 2. Update each section below with your design choices
 * 3. Replace placeholder values with your SVG paths, colors, etc.
 * 4. Register your theme in src/themes/index.ts
 * 5. Write tests in src/__tests__/my-theme.test.ts
 * 6. Run tests to validate: pnpm test -- my-theme
 */

export const templateTheme: Theme = {
  // ============= STEP 2: Metadata =============
  // A unique identifier (lowercase, no spaces)
  id: 'template-theme',

  // Display name shown in theme selector
  name: 'Template Theme',

  // Theme style: "refined" or "neobrutalism"
  style: 'refined',

  // ============= STEP 3: SVG Shapes =============
  // Define 7 house silhouettes, each as an SVG path string.
  // Requirements:
  // - viewBox="0 0 40 40" (implied; paths use 0-40 coordinate space)
  // - Stroke: 2px solid, no fill (path fill="none")
  // - File size: <1KB when rendered
  // - Unique yet cohesive architectural style
  //
  // Generate paths from:
  // - Figma (select shape > right-click > copy SVG code)
  // - Illustrator (export as SVG, extract <path> element)
  // - Hand-drawn (sketch in Figma, then export)
  shapes: {
    // Simple pitched roof cottage
    cottage: 'M5 35 L5 20 L20 5 L35 20 L35 35 Z',

    // Row of townhouses
    rowhouse: 'M8 35 L8 16 L20 5 L32 16 L32 35 Z',

    // Tall narrow tower or clock tower
    tower: 'M13 35 L13 3 L16 1 L24 1 L27 3 L27 35 Z',

    // Complex Victorian with multiple roof peaks
    victorian: 'M5 35 L5 22 L12 12 L20 3 L28 12 L35 22 L35 35 Z',

    // Barn with curved roof (use quadratic Bezier for hand-drawn feel)
    barn: 'M4 35 L4 20 Q20 8 36 20 L36 35 Z',

    // Low-slung bungalow or ranch
    bungalow: 'M3 35 L3 24 L10 17 L30 17 L37 24 L37 35 Z',

    // Modern tall building or skyscraper
    skyscraper: 'M13 35 L13 2 L20 0 L27 2 L27 35 Z',
  },

  // ============= STEP 4: Color Palette =============
  // Define 7 colors manually (don't auto-generate).
  // Each color maps to a chip type in the game.
  //
  // Validation checklist:
  // - Pick colors from inspiration (mood board, nature, art)
  // - Use 6-digit hex format: #RRGGBB
  // - Check contrast: https://webaim.org/resources/contrastchecker/
  // - Each color must have ≥4.5:1 ratio against:
  //   - --color-surface-cell (#241F35)
  //   - --color-surface-cell-valid (#2C4A2E)
  // - Test color blindness: https://www.color-blindness.com/coblis/
  colorPalette: {
    'color-1': '#B04A2F',
    'color-2': '#3D7AB5',
    'color-3': '#4A7C59',
    'color-4': '#C4A35A',
    'color-5': '#8B3A52',
    'color-6': '#2B2F5E',
    'color-7': '#E8D5B0',
  },

  // ============= STEP 6: Surfaces & Fonts =============
  // Surface colors: backgrounds, grids, cells, states
  surfaces: {
    // Primary background
    background: '#0F0D17',
    // Grid container background
    grid: '#1C1828',
    // Empty cell
    cell: '#241F35',
    // Cell on hover
    cellHover: '#2E2847',
    // Cell valid for placement
    cellValid: '#2C4A2E',
    // Cell invalid for placement
    cellInvalid: '#4A2020',
  },

  // Font families for display (headings) and UI (body)
  fonts: {
    // Display: large headlines, game title, etc.
    display: "'Bebas Neue', sans-serif",
    // UI: body text, buttons, labels, etc.
    ui: "'Inter', system-ui, sans-serif",
  },

  // ============= STEP 5: Motion Preset =============
  // Choose a motion persona (calm/playful/flashy) or blend.
  // See spec section 5 for detailed parameters and design notes.
  //
  // Motion personas:
  // - Calm: stiffness 100, damping 25 (slow, meditative)
  // - Playful: stiffness 260, damping 20 (springy, energetic)
  // - Flashy: stiffness 350, damping 15 (aggressive, arcade-like)
  //
  // You can also blend parameters from multiple personas.
  animationPreset: {
    // Chip placement spring animation
    chipPlace: { type: 'spring', stiffness: 260, damping: 20, mass: 1 },

    // Chip shake on invalid placement
    chipInvalid: { x: [-6, 6, -4, 4, 0], duration: 0.3 },

    // Draw from bag animation
    chipDraw: { duration: 0.25, ease: 'easeOut' },

    // Cell highlight pulse
    cellPulse: { duration: 0.6, repeat: 1 },

    // Turn transition
    turnIn: { duration: 0.4, ease: 'easeOut' },

    // Celebration particles (row complete, game end)
    celebrate: { duration: 1.2, particleCount: 60, spread: 100 },

    // Wave 4: Extended Animation Preset
    chipDrawIn: { duration: 0.3, ease: 'easeOut', stagger: 0.05 },
    placementRipple: { duration: 0.4, maxScale: 1.15, ease: 'easeOut' },
    turnSweep: { duration: 0.5, ease: 'easeOut' },
    scorePop: { type: 'spring', stiffness: 260, damping: 20, mass: 1 },
    bagShake: { x: [0, -4, 4, -2, 2, 0], duration: 0.3 },
    hoverLift: { duration: 0.2, scale: 1.05, ease: 'easeOut' },
    handReorder: { duration: 0.3, ease: 'easeOut' },
    badgeGlowPulse: { duration: 0.8, minOpacity: 0.6, maxOpacity: 1 },
    exchangeFlash: { duration: 0.3, opacity: 0.8 },
    discardFade: { duration: 0.4, endScale: 0.8, ease: 'easeOut' },
    cellEntrance: { duration: 0.3, stagger: 0.03, ease: 'easeOut' },
    errorShake: { x: [0, -8, 8, -4, 4, 0], duration: 0.4, borderFlash: true },
  },
  styleProps: {
    borderWidth: 0,
    shadowOffset: 0,
    shadowColor: 'transparent',
    borderRadius: 8,
    borderColor: 'transparent',
  },
}
