# Phase 08: Frontend Design x5 — Verification Strategy

**Phase:** 08-frontend-design-x5
**Created:** 2026-06-10
**Status:** Active

---

## Verification Architecture

This phase has 10 quality gates. Each gate has specific test commands, acceptance criteria, and failure recovery procedures. Gates are checked in order — if a gate fails, subsequent gates are blocked until the failure is resolved.

---

## Gate 1: Visual Regression Baseline

**When:** Before any visual changes (Wave 1 start)

**Test command:**
```bash
cd packages/e2e && yarn test:visual --update-snapshots
```

**What it does:**
- Captures screenshots of all screens at 3 viewports (375px, 768px, 1280px)
- Saves to `packages/e2e/test-results/visual-baseline/`
- Commits baseline screenshots to git

**Acceptance criteria:**
- [ ] All 18 screenshots captured (6 screens × 3 viewports)
- [ ] Screenshots are committed to git
- [ ] No screenshot is blank or partially rendered

**Failure recovery:**
- If screenshot is blank: Check that Docker stack is running (`docker compose ps`)
- If screenshot is partially rendered: Increase `waitForTimeout` before screenshot
- If viewport is wrong: Check Playwright config viewport settings

---

## Gate 2: Pixel Diff Threshold

**When:** After each visual change batch (end of each wave)

**Test command:**
```bash
cd packages/e2e && yarn test:visual
```

**What it does:**
- Compares new screenshots against baseline
- Reports pixel differences per screenshot
- Fails if any screenshot exceeds threshold

**Acceptance criteria:**
- [ ] All screenshots pass with `maxDiffPixels: 50, threshold: 0.1`
- [ ] Any failures are reviewed and either:
  - Fixed (implementation adjusted), or
  - Baseline updated with justification comment

**Failure recovery:**
- Review diff images in `test-results/` directory
- If diff is expected (intentional visual change): Update baseline with `--update-snapshots`
- If diff is unexpected: Fix implementation and re-run

---

## Gate 3: Performance Budget

**When:** After animation implementation (Wave 4 end)

**Test command:**
```bash
# Manual: Chrome DevTools Performance panel
# Automated: Lighthouse CI
npx lighthouse http://localhost:8077 --output=json --output-path=report.json \
  --only-categories=performance \
  --throttling-method=devtools \
  --throttling.rttMs=150 \
  --throttling.throughputKbps=1638.4
```

**What it does:**
- Measures frame rate during animations
- Checks for layout thrashing
- Reports Core Web Vitals

**Acceptance criteria:**
- [ ] All animations maintain ≥ 55fps during interaction
- [ ] Zero forced reflows during animation frames
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total blocking time < 200ms

**Failure recovery:**
- If frame rate < 55fps: Replace JS animations with CSS keyframes
- If layout thrashing: Replace `top`/`left` with `transform`
- If FCP/LCP too high: Optimize font loading, reduce CSS bundle size

---

## Gate 4: Accessibility (WCAG 2.2 AA)

**When:** After color/contrast changes (Wave 5 end)

**Test command:**
```bash
# Automated contrast check
npx axe http://localhost:8077 --exit --tags=wcag2aa

# Manual: Screen reader testing
# - VoiceOver (macOS): Cmd+F5
# - NVDA (Windows): Insert+N
```

**What it does:**
- Checks all text contrast ratios
- Verifies focus indicators
- Tests `prefers-reduced-motion` support
- Validates color-independent information

**Acceptance criteria:**
- [ ] All text ≥ 4.5:1 contrast ratio (normal) or ≥ 3:1 (large)
- [ ] All interactive elements have visible focus indicators
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Color is not sole means of conveying information
- [ ] Screen reader announces turn changes, chip placements, game state

**Failure recovery:**
- If contrast fails: Adjust color values in theme files
- If focus indicator missing: Add `:focus-visible` styles
- If reduced-motion not respected: Add `prefersReducedMotion()` checks
- If screen reader silent: Add `aria-live` regions for state changes

---

## Gate 5: Cross-Browser Compatibility

**When:** After CSS changes (end of Wave 3)

**Test command:**
```bash
cd packages/e2e && yarn test --project=chromium --project=firefox --project=webkit
```

**What it does:**
- Runs E2E tests on Chrome, Firefox, Safari (WebKit)
- Captures screenshots per browser
- Compares visual rendering

**Acceptance criteria:**
- [ ] All E2E tests pass on all 3 browsers
- [ ] Visual rendering is consistent (diff < 50 pixels per screenshot)
- [ ] No CSS property fallbacks missing for critical features
- [ ] `backdrop-filter` gracefully degrades on unsupported browsers

**Failure recovery:**
- If CSS property unsupported: Add fallback via `@supports` query
- If visual diff too large: Adjust CSS for browser-specific rendering
- If test fails on one browser: Check browser-specific CSS bugs

---

## Gate 6: Theme Consistency

**When:** After theme token changes (end of Wave 5)

**Test command:**
```bash
cd packages/e2e && yarn test:visual --theme=town77 --theme=playful-pastel
```

**What it does:**
- Captures screenshots for both themes at all viewports
- Compares against theme-specific baselines
- Verifies token injection works without re-render

**Acceptance criteria:**
- [ ] Both themes pass visual regression with their own baselines
- [ ] Token injection works without component re-render (check React DevTools)
- [ ] No hardcoded colors in components (grep for `#[0-9a-fA-F]{6}` in component files)

**Failure recovery:**
- If token injection causes re-render: Move token read to CSS, not JS
- If hardcoded colors found: Replace with CSS custom properties
- If theme baseline missing: Capture new baseline with `--update-snapshots`

---

## Gate 7: Animation Correctness

**When:** After each animation implementation (Wave 4)

**Test command:**
```bash
cd packages/e2e && yarn test:animations
```

**What it does:**
- Triggers each animation via user interaction
- Verifies animation fires on correct event
- Measures animation duration (±50ms tolerance)
- Tests `prefers-reduced-motion` disables animation

**Acceptance criteria:**
- [ ] All 15 animations trigger on correct events
- [ ] No animation fires incorrectly (false positives)
- [ ] Animation duration matches theme preset (±50ms)
- [ ] `prefers-reduced-motion` disables all non-essential animations

**Failure recovery:**
- If animation doesn't trigger: Check event handler binding
- If animation fires incorrectly: Add guard condition
- If duration wrong: Adjust spring config or CSS animation duration
- If reduced-motion not respected: Add `prefersReducedMotion()` check

---

## Gate 8: Layout Stability

**When:** After responsive breakpoint changes (end of Wave 6)

**Test command:**
```bash
cd packages/e2e && yarn test:viewport-sweep
```

**What it does:**
- Sweeps viewport from 320px to 1920px in 40px increments
- Captures screenshot at each viewport
- Checks for horizontal scroll, overflow, broken layout

**Acceptance criteria:**
- [ ] No horizontal scroll at any viewport
- [ ] Grid cells maintain aspect ratio at all sizes
- [ ] Hand container doesn't overflow at minimum viewport
- [ ] Player badges wrap gracefully on narrow screens

**Failure recovery:**
- If horizontal scroll: Add `overflow-x: hidden` or fix width constraints
- If aspect ratio broken: Use `aspect-ratio: 1` CSS property
- If overflow: Adjust `min-width`/`max-width` constraints
- If badges don't wrap: Add `flex-wrap: wrap` to container

---

## Gate 9: Code Quality

**When:** After each implementation batch (end of each wave)

**Test command:**
```bash
pnpm lint && pnpm typecheck && pnpm test
```

**What it does:**
- Runs Biome linter
- Runs TypeScript type checker
- Runs all unit tests (324) and E2E tests (35)

**Acceptance criteria:**
- [ ] Zero lint errors
- [ ] Zero type errors
- [ ] All 324 unit tests pass
- [ ] All 35 E2E tests pass
- [ ] No `console.log` in source files

**Failure recovery:**
- If lint errors: Run `pnpm format` to auto-fix, then fix remaining manually
- If type errors: Fix type annotations or add type guards
- If tests fail: Debug failing tests, fix implementation or update tests

---

## Gate 10: Bundle Size Budget

**When:** Before merge (end of Wave 7)

**Test command:**
```bash
pnpm build
# Check bundle size
ls -lh packages/client/dist/assets/*.js | awk '{print $5, $9}'
```

**What it does:**
- Builds production bundle
- Reports bundle size per chunk
- Compares against budget (15KB gzipped increase)

**Acceptance criteria:**
- [ ] Client bundle increase < 15KB gzipped
- [ ] No new runtime dependencies
- [ ] SVG defs shared, not duplicated per component

**Failure recovery:**
- If bundle too large: Remove unused CSS, optimize SVG defs
- If new dependency added: Find CSS-only alternative
- If SVG defs duplicated: Move to shared `ChipDefs` component

---

## Gate Execution Order

```
Wave 1 → Gate 9 (code quality)
Wave 2 → Gate 2 (pixel diff), Gate 9
Wave 3 → Gate 5 (cross-browser), Gate 9
Wave 4 → Gate 3 (performance), Gate 7 (animation correctness), Gate 9
Wave 5 → Gate 4 (accessibility), Gate 6 (theme consistency), Gate 9
Wave 6 → Gate 8 (layout stability), Gate 9
Wave 7 → Gate 1 (baseline), Gate 2 (diff), Gate 3 (performance),
         Gate 4 (accessibility), Gate 5 (cross-browser),
         Gate 6 (theme), Gate 7 (animation), Gate 8 (layout),
         Gate 9 (code quality), Gate 10 (bundle size)
```

**Note:** Gate 9 (code quality) runs after every wave. Other gates run at their specified waves and are re-checked in Wave 7 (final verification).

---

## Verification Summary Template

After all gates pass, fill this summary:

```markdown
## Verification Summary

**Phase:** 08-frontend-design-x5
**Date:** [date]
**Status:** PASSED / FAILED

### Gate Results

| Gate | Status | Notes |
|------|--------|-------|
| 1. Visual Baseline | ✅ / ❌ | |
| 2. Pixel Diff | ✅ / ❌ | |
| 3. Performance | ✅ / ❌ | |
| 4. Accessibility | ✅ / ❌ | |
| 5. Cross-Browser | ✅ / ❌ | |
| 6. Theme Consistency | ✅ / ❌ | |
| 7. Animation Correctness | ✅ / ❌ | |
| 8. Layout Stability | ✅ / ❌ | |
| 9. Code Quality | ✅ / ❌ | |
| 10. Bundle Size | ✅ / ❌ | |

### Failed Gates (if any)

[Description of failures and recovery actions]

### Sign-off

- [ ] All gates passed
- [ ] Visual regression baselines committed
- [ ] Performance metrics documented
- [ ] Accessibility audit complete
- [ ] Cross-browser testing complete
- [ ] Bundle size within budget
```

---

*Phase: 08-frontend-design-x5*
*Verification strategy created: 2026-06-10*
