# Phase 08: Frontend Design x5 — Plan & Quality Gates

**Gathered:** 2026-06-10
**Status:** Paused after Wave 3 (HANDOFF.md exists). Waves 1-3 complete, 372 tests green. Resume at Wave 4.
**Source:** Design research + codebase analysis

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

## Quality Gates

### Gate 1: Visual Regression Baseline
**When:** Before any visual changes
**What:** Capture screenshots of all screens at 3 viewports (375px, 768px, 1280px)
**How:** Playwright screenshot tests with `toHaveScreenshot()` assertions
**Pass criteria:** All baseline screenshots captured and committed
**Files:** `packages/e2e/tests/visual-regression.spec.ts`

### Gate 2: Pixel Diff Threshold
**When:** After each visual change batch
**What:** Compare new screenshots against baseline
**How:** Playwright `toHaveScreenshot({ maxDiffPixels: 50, threshold: 0.1 })`
**Pass criteria:** < 50 pixel differences per screenshot, threshold 0.1
**Fail action:** Review diff, adjust implementation or update baseline with justification

### Gate 3: Performance Budget
**When:** After animation implementation
**What:** Measure frame rate during animations
**How:** Chrome DevTools Performance panel + `requestAnimationFrame` monitoring
**Pass criteria:**
- All animations maintain ≥ 55fps during interaction
- No layout thrashing (zero forced reflows during animation frames)
- First Contentful Paint < 1.5s on 3G Fast simulation
- Largest Contentful Paint < 2.5s on 3G Fast simulation
- Total JS bundle size increase < 15KB gzipped (animation libs already included)

### Gate 4: Accessibility (WCAG 2.2 AA)
**When:** After color/contrast changes
**What:** Verify all text and interactive elements meet contrast requirements
**How:** Automated contrast checker + manual screen reader testing
**Pass criteria:**
- All text ≥ 4.5:1 contrast ratio (normal text) or ≥ 3:1 (large text)
- All interactive elements have visible focus indicators
- All animations respect `prefers-reduced-motion`
- Color is not the sole means of conveying information
- Screen reader announces turn changes, chip placements, and game state

### Gate 5: Cross-Browser Compatibility
**When:** After CSS changes (shadows, gradients, backdrop-filter)
**What:** Test on Chrome, Firefox, Safari, Edge
**How:** Playwright multi-browser test suite
**Pass criteria:**
- All visual features render correctly on all 4 browsers
- No CSS property fallbacks missing for critical features
- `backdrop-filter` gracefully degrades on unsupported browsers

### Gate 6: Theme Consistency
**When:** After theme token changes
**What:** Verify both themes (Town 77 + Playful Pastel) render correctly
**How:** Visual regression tests for both themes at all viewports
**Pass criteria:**
- Both themes pass visual regression with their own baselines
- Token injection works without component re-render
- No hardcoded colors in components (all use CSS custom properties)

### Gate 7: Animation Correctness
**When:** After each animation implementation
**What:** Verify each micro-interaction triggers correctly
**How:** Playwright interaction tests + manual verification
**Pass criteria:**
- All 15 animations trigger on correct events
- No animation fires incorrectly (false positives)
- Animation duration matches theme preset (±50ms tolerance)
- `prefers-reduced-motion` disables all non-essential animations

### Gate 8: Layout Stability
**When:** After responsive breakpoint changes
**What:** Verify layout doesn't break at any viewport size
**How:** Playwright viewport sweep (320px → 1920px in 40px increments)
**Pass criteria:**
- No horizontal scroll at any viewport
- Grid cells maintain aspect ratio at all sizes
- Hand container doesn't overflow at minimum viewport
- Player badges wrap gracefully on narrow screens

### Gate 9: Code Quality
**When:** After each implementation batch
**What:** Lint, typecheck, and test
**How:** `pnpm lint`, `pnpm typecheck`, `pnpm test`
**Pass criteria:**
- Zero lint errors
- Zero type errors
- All existing tests pass (324 unit + 35 E2E)
- New visual regression tests pass

### Gate 10: Bundle Size Budget
**When:** Before merge
**What:** Verify bundle size impact
**How:** `pnpm build` + bundle analyzer
**Pass criteria:**
- Client bundle increase < 15KB gzipped
- No new runtime dependencies (CSS-only additions preferred)
- SVG defs shared, not duplicated per component

---

## Implementation Waves

### Wave 1: Foundation (Day 1-2)
**Dependencies:** None
**Autonomous:** true

1. **Shadow system tokens** — Add elevation scale to `tokens.css`
2. **Surface texture CSS** — Create `textures.css` with SVG noise patterns
3. **Spacing scale fix** — Smooth the spacing scale progression
4. **Fluid typography** — Implement `clamp()` values from spec
5. **Responsive breakpoints** — Add media queries for grid/hand sizing

**Verification:** `pnpm test` passes, no visual changes yet (tokens only)

### Wave 2: Chip Overhaul (Day 2-3)
**Dependencies:** Wave 1
**Autonomous:** true

1. **ChipDefs component** — Create shared SVG defs with gradients/filters
2. **Chip 4-layer rendering** — Update `Chip.tsx` to use multi-layer SVG
3. **Chip selection state** — Glow + scale + shadow elevation
4. **Chip invalid state** — Red vignette overlay
5. **Per-color gradient definitions** — Add to both themes

**Verification:** Visual regression baseline → new screenshots → review diffs

### Wave 3: Surface Depth (Day 3-4)
**Dependencies:** Wave 1
**Autonomous:** true

1. **Grid surface** — Apply wood grain texture + gradient overlay + shadow-md
2. **Cell inset** — Apply inner shadow to empty cells
3. **Cell valid glow** — Replace flat outline with radial gradient + glow shadow
4. **Hand container** — Apply felt texture + inner shadow
5. **PlayerBadge glow** — Apply accent glow shadow to active turn badge

**Verification:** Visual regression diff review, performance check

### Wave 4: Animation System (Day 4-6)
**Dependencies:** Wave 2, Wave 3
**Autonomous:** true

1. **Animation preset extension** — Add 15 interaction configs to theme types
2. **Chip draw-in** — Scale from 0 + fade, staggered
3. **Placement ripple** — CSS keyframes expanding ring
4. **Turn indicator sweep** — Border-color + gradient animation
5. **Score pop** — Scale bounce with spring
6. **Bag shake** — Translate X oscillation
7. **Card hover lift** — Scale 1.05 + shadow-md
8. **Hand reorder FLIP** — useLayoutEffect + transform
9. **Badge glow pulse** — Box-shadow pulse animation
10. **Exchange flash** — Brief white flash overlay
11. **Discard fade-out** — Scale 0.8 + opacity 0
12. **Cell entrance** — Scale from 0.8 + opacity, staggered per row
13. **Error shake v2** — Shake + red border flash
14. **Win celebration** — Confetti particles (already spec'd)

**Verification:** Each animation tested individually, then integration test

### Wave 5: Color & Typography (Day 6-7)
**Dependencies:** Wave 2
**Autonomous:** true

1. **Accent glow palette** — Add soft/medium/base/bright accent tokens
2. **Board surface gradient** — Replace flat background with linear gradient
3. **Valid cell radial gradient** — Replace flat color with radial illumination
4. **Cell hover brightness** — Add filter + scale on hover
5. **Typography drama** — Turn indicator animation, tabular-nums, letter-spacing

**Verification:** Visual regression, contrast check (Gate 4)

### Wave 6: Layout Robustness (Day 7-8)
**Dependencies:** Wave 1
**Autonomous:** true

1. **Container queries** — GameScreen layout adaptation
2. **Aspect ratio enforcement** — CSS `aspect-ratio: 1` on cells
3. **Responsive panel rearrangement** — Wide vs narrow layouts
4. **Font loading optimization** — Preload Bebas Neue + Inter

**Verification:** Viewport sweep test (Gate 8), Lighthouse performance

### Wave 7: Quality Gate Integration (Day 8-9)
**Dependencies:** All previous waves
**Autonomous:** true

1. **Visual regression test suite** — Playwright screenshot tests
2. **Performance monitoring** — Frame rate checks during animations
3. **Accessibility audit** — Contrast checker + screen reader testing
4. **Cross-browser tests** — Chrome, Firefox, Safari, Edge
5. **Bundle size check** — Build + analyze

**Verification:** All 10 quality gates pass

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

## Risk Summary

| Risk | Impact | Mitigation |
|------|--------|------------|
| SVG defs bloat DOM | High | Shared ChipDefs at GameScreen level, not per-chip |
| Animation performance on low-end devices | Medium | `prefers-reduced-motion` fallback, transform-only animations |
| Visual regression false positives | Medium | Set appropriate diff thresholds, review diffs manually |
| Theme token conflicts | Low | Strict token naming convention, no hardcoded colors |
| Bundle size increase | Medium | CSS-only additions preferred, no new runtime deps |
| Cross-browser CSS support | Medium | Use caniuse.com to verify support, add fallbacks |

---

*Phase: 08-frontend-design-x5*
*Context gathered: 2026-06-10 via design research + codebase analysis*
