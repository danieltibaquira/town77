# Phase 08: Frontend Design x5 - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning
**Source:** Design research + codebase analysis + user requirements

---

## Phase Boundary

This phase upgrades the Town77 frontend client from its current minimal/flat design to a premium board game UI with 5x the visual richness, depth, animation breadth, and polish. It touches every visual layer: tokens, themes, components, animations, and layout.

**Delivers:**
- Multi-layer elevation/shadow system (5 levels + inner glow + ambient occlusion)
- Surface textures (wood grain, felt, gradient overlays) via CSS
- Chip visual overhaul (4-layer SVG: shadow → base gradient → silhouette → specular highlight)
- 15 micro-interactions (draw-in, ripple, hover lift, hand reorder FLIP, score pop, etc.)
- Color gradient system (per-chip gradients, accent glow palette, board surface gradient)
- Typography drama (tabular-nums, weight animation, letter-spacing transitions)
- Layout robustness (fluid `clamp()` typography, responsive breakpoints, container queries)

**Out of scope:**
- Server-side changes
- E2E test infrastructure changes (existing tests must pass, new visual tests are separate)
- New game mechanics or rules
- Sound design (visual only)

---

## Implementation Decisions

### Elevation & Shadow System
- 5-level scale (`--shadow-xs` through `--shadow-xl`) using CSS custom properties
- Inner shadows for inset surfaces (`--shadow-inner-xs`, `--shadow-inner-sm`)
- Glow shadows for active states (`--shadow-glow-accent`, `--shadow-glow-valid`)
- All shadows use `rgba(0,0,0,...)` for dark theme compatibility
- Light theme (Playful Pastel) gets inverted shadow colors via theme injection

### Surface Textures
- SVG noise patterns via `feTurbulence` filter, encoded as data URIs in CSS
- Wood grain texture for grid/board surface
- Felt texture for hand container
- Radial gradient overlays for ambient lighting effects
- Textures applied via `background-image` + `background-blend-mode: overlay`
- Opacity kept at 0.06–0.08 to avoid overwhelming the design

### Chip SVG Overhaul
- 4-layer rendering: drop shadow → base gradient → shape silhouette → specular highlight
- SVG `<defs>` block with gradients/filters shared via `ChipDefs` component at `GameScreen` level
- Per-color gradients (lighter → base → darker) for 3D emboss effect
- Selection state: outer glow + scale(1.08) + shadow elevation change
- Invalid state: red vignette overlay + shake animation (existing)
- `ChipDefs` rendered once, not per-chip, to minimize DOM/SVG overhead

### Animation System (15 Micro-Interactions)
- Extend `AnimationPreset` in theme to include configs for all 15 interactions
- `useAnimationPreset()` hook returns spring/config tuples
- `animations.css` for CSS-only keyframes (ripple, glow pulse, shake variants)
- FLIP animation for hand chip reorder (`useLayoutEffect` + `transform`)
- All animations respect `prefers-reduced-motion`
- Performance budget: no animation causes layout thrashing (use `transform` + `opacity` only)

### Color & Gradient System
- Per-chip 2-stop linear gradients for emboss effect
- Accent glow palette (soft, medium, base, bright) for state differentiation
- Board surface gradient (not flat) — subtle 180deg linear gradient
- Valid cell radial gradient (illuminates from center)
- Cell hover: `filter: brightness(1.2)` + `transform: scale(1.02)`

### Typography
- Implement spec's `clamp()` values for fluid typography
- `font-variant-numeric: tabular-nums` for score display
- Turn indicator: scale bounce + color flash on turn change
- Room code: letter-spacing animation on appearance
- Weight variation: 300 (secondary) → 500 (default) → 700 (primary) → 900 (display)

### Layout Robustness
- Smooth spacing scale (2xs through 3xl with even progression)
- Responsive breakpoints for grid cell sizing
- Hand container responsive sizing
- `aspect-ratio: 1` enforcement on cells
- Container queries for GameScreen layout adaptation

---

## Claude's Discretion

- Specific gradient color values (lighter/darker variants of base colors)
- Exact animation durations and easing curves (within theme preset ranges)
- SVG filter parameters for wood grain/felt textures
- Specific breakpoint values for responsive design
- Container query thresholds for GameScreen layout

---

## Canonical References

### Design System
- `docs/design-system/spec-theme-and-voice.md` — Complete design system specification
- `docs/design-system/README.md` — Design system overview

### Current Implementation
- `packages/client/src/styles/tokens.css` — CSS custom properties (Layer 1 + 3)
- `packages/client/src/styles/reset.css` — CSS reset
- `packages/client/src/themes/town77.ts` — Default theme
- `packages/client/src/themes/playful-pastel.ts` — Alternative theme
- `packages/client/src/themes/index.ts` — Theme registry
- `packages/client/src/lib/theme.ts` — ThemeContext, injectTokens, useTheme
- `packages/client/src/lib/motion.ts` — Framer Motion helpers
- `packages/shared-types/src/theme.ts` — Theme TypeScript interfaces

### Components to Modify
- `packages/client/src/components/Chip.tsx` — Chip rendering
- `packages/client/src/components/Cell.tsx` — Cell rendering
- `packages/client/src/components/Grid.tsx` — Grid container
- `packages/client/src/components/Hand.tsx` — Hand layout
- `packages/client/src/components/PlayerBadge.tsx` — Player badges
- `packages/client/src/components/ActionBar.tsx` — Action buttons
- `packages/client/src/screens/GameScreen.tsx` — Main game screen
- `packages/client/src/screens/LobbyScreen.tsx` — Lobby screen

### Test Infrastructure
- `packages/e2e/tests/` — Existing E2E tests (35 tests)
- `packages/client/src/__tests__/` — Unit tests (324 tests)
- `packages/e2e/playwright.config.ts` — Playwright configuration

---

## Specific Ideas

- Reference Chess.com's board rendering for shadow/depth techniques
- Reference Scrabble GO's tile placement animations for spring physics
- Reference Azul's digital version for chunky tile pieces with high-contrast fills
- Use `feTurbulence` SVG filter for procedural wood grain texture
- Use FLIP animation pattern for hand chip reorder (Josh Comeau technique)
- Use CSS `@keyframes` for decorative effects (ripple, glow pulse) to avoid JS overhead
- Use `backdrop-filter: blur()` for glassmorphic ActionBar overlay

---

## Deferred Ideas

- Sound design for chip placement, exchange, discard (separate phase)
- 3D chip rendering with WebGL/Three.js (overkill for current scope)
- Haptic feedback for mobile devices (requires native app, not web)
- Custom cursor styles (nice-to-have, not essential)
- Particle effects for win celebration (already spec'd, can be added later)

---

*Phase: 08-frontend-design-x5*
*Context gathered: 2026-06-10 via design research + codebase analysis*
