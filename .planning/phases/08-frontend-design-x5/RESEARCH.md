# Phase 08: Frontend Design x5 — Research

**Gathered:** 2026-06-10
**Status:** Research complete

---

## Technical Approaches

### 1. Elevation & Shadow System

**Approach:** CSS custom properties with multi-layer box-shadows

**Why:** CSS `box-shadow` is hardware-accelerated (composited, not repainted), has universal browser support, and can be themed via CSS custom properties. Multi-layer shadows (2-3 layers per elevation) create more realistic depth than single shadows.

**Reference:** Material Design 3 elevation system uses 2-layer shadows (ambient + directional). Apple HIG uses similar approach with tonal overlays.

**Implementation:**
```css
--shadow-md:
  0 4px 8px rgba(0,0,0,0.3),    /* ambient shadow (soft, spread) */
  0 2px 4px rgba(0,0,0,0.2);    /* directional shadow (tighter, darker) */
```

**Performance:** `box-shadow` is composited by the GPU when combined with `transform` and `opacity`. No layout or paint required during animation.

**Browser support:** Universal (all evergreen browsers, Safari 12+, Firefox 65+, Chrome 88+)

### 2. Surface Textures via SVG Filters

**Approach:** `feTurbulence` + `feColorMatrix` filter encoded as data URI in CSS `background-image`

**Why:** SVG filters generate procedural noise that looks like wood grain, felt, or linen. Encoding as data URI avoids external asset requests. `background-blend-mode: overlay` blends texture with underlying color.

**Reference:** CSS-Tricks "Creating Textures with SVG Filters", Josh Comeau's texture techniques.

**Implementation:**
```css
background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
background-blend-mode: overlay;
opacity: 0.06;
```

**Performance:** SVG filter is rendered once and cached by the browser. No runtime cost after initial paint.

**Browser support:** Universal for `feTurbulence`. `background-blend-mode` supported in all evergreen browsers.

### 3. Multi-Layer Chip SVG

**Approach:** 4-layer SVG rendering with shared `<defs>` block

**Why:** Single-layer SVG chips look flat and wireframe-like. Multi-layer rendering (shadow → base → silhouette → highlight) creates 3D emboss effect without needing WebGL or Canvas.

**Reference:** Board game digital adaptations (Chess.com, Scrabble GO, Azul) all use multi-layer piece rendering with drop shadows and specular highlights.

**Implementation:**
```tsx
// ChipDefs.tsx — rendered once at GameScreen level
<svg width="0" height="0" style={{ position: 'absolute' }}>
  <defs>
    {colors.map((color, i) => (
      <linearGradient key={i} id={`chip-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={lighter(color)} />
        <stop offset="50%" stopColor={color} />
        <stop offset="100%" stopColor={darker(color)} />
      </linearGradient>
    ))}
    <filter id="chip-shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.35" />
    </filter>
  </defs>
</svg>

// Chip.tsx — uses defs via URL reference
<rect fill={`url(#chip-grad-${colorIndex})`} filter="url(#chip-shadow)" />
<path d={shapePath} fill={`url(#chip-grad-${colorIndex})`} />
<ellipse cx={16} cy={14} rx={12} ry={6} fill="url(#sheen)" opacity={0.4} />
```

**Performance:** SVG `<defs>` are shared across all chip instances. Browser caches gradient/filter definitions. No per-chip overhead beyond the `<use>` reference.

**Browser support:** Universal for SVG gradients and filters.

### 4. FLIP Animation for Hand Reorder

**Approach:** `useLayoutEffect` + `getBoundingClientRect` + `transform` translation

**Why:** When hand chips change order (after placement, exchange, or discard), React re-renders and DOM nodes move instantly. FLIP (First, Last, Invert, Play) captures the before/after positions and animates the delta using `transform`, which is GPU-accelerated.

**Reference:** Paul Lewis "FLIP Your Animations", Josh Comeau "Animating the Unanimatable", Framer Motion `layout` prop (already used in Chip.tsx).

**Implementation:**
```tsx
const handRef = useRef<HTMLDivElement>(null)
const prevPositions = useRef<Map<string, DOMRect>>(new Map())

useLayoutEffect(() => {
  if (!handRef.current) return
  
  // First: capture current positions before React re-renders
  const firstPositions = prevPositions.current
  
  // Last: get new positions after React re-renders
  const children = handRef.current.children
  const lastPositions = new Map<string, DOMRect>()
  
  for (const child of children) {
    const key = child.getAttribute('data-chip-key')!
    lastPositions.set(key, child.getBoundingClientRect())
  }
  
  // Invert: apply transform to undo the position change
  for (const [key, lastRect] of lastPositions) {
    const firstRect = firstPositions.get(key)
    if (!firstRect) continue
    
    const deltaX = firstRect.left - lastRect.left
    const deltaY = firstRect.top - lastRect.top
    
    if (deltaX === 0 && deltaY === 0) continue
    
    const element = handRef.current.querySelector(`[data-chip-key="${key}"]`)
    if (!element) continue
    
    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`
    element.style.transition = 'none'
  }
  
  // Play: remove transform with transition to animate to final position
  requestAnimationFrame(() => {
    for (const child of children) {
      child.style.transform = ''
      child.style.transition = `transform ${preset.chipDraw.duration}ms ${preset.chipDraw.ease}`
    }
  })
  
  prevPositions.current = lastPositions
}, [chips])
```

**Performance:** `transform` is GPU-accelerated. `useLayoutEffect` runs synchronously before paint, so no visual flash. `requestAnimationFrame` ensures browser has calculated layout before playing animation.

**Browser support:** Universal for `transform` and `getBoundingClientRect`.

### 5. CSS-Only Keyframe Animations

**Approach:** `@keyframes` for decorative effects (ripple, glow pulse, shake variants)

**Why:** CSS keyframes are more performant than JS-driven animations for decorative effects because they run on the compositor thread without JavaScript overhead. They also respect `prefers-reduced-motion` via media query.

**Reference:** CSS-Tricks "A Complete Guide to CSS Animations", Google Web Fundamentals "Animations".

**Implementation:**
```css
@keyframes placement-ripple {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 0 3px var(--color-text-accent); }
  50% { box-shadow: 0 0 0 6px var(--color-text-accent), 0 0 12px rgba(196,163,90,0.4); }
}

.cell-placed::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--cell-radius);
  animation: placement-ripple 600ms ease-out forwards;
  pointer-events: none;
}
```

**Performance:** CSS keyframes run on compositor thread. No JavaScript overhead. `prefers-reduced-motion` media query can disable all animations globally.

**Browser support:** Universal for `@keyframes` and `animation`.

### 6. Backdrop-Filter for Glassmorphic Overlays

**Approach:** `backdrop-filter: blur(12px)` + semi-transparent background for ActionBar and modal overlays

**Why:** Creates depth by blurring the content behind the overlay, making it feel like a frosted glass panel floating above the board. This is a modern UI pattern used in iOS, macOS, and premium web apps.

**Reference:** Apple HIG "Materials", CSS-Tricks "Glassmorphism".

**Implementation:**
```css
.action-bar {
  background: rgba(15, 13, 23, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.1);
}
```

**Performance:** `backdrop-filter` requires GPU compositing. Can be expensive on low-end devices, so fallback to solid background on unsupported browsers.

**Browser support:** Chrome 76+, Firefox 103+, Safari 9+, Edge 79+. Firefox support was added in 2022.

**Fallback:** `@supports not (backdrop-filter: blur(12px))` → solid background with higher opacity.

---

## Quality Gate Validation Strategies

### Visual Regression Testing
**Tool:** Playwright `toHaveScreenshot()`
**Strategy:** Capture baseline screenshots before changes, compare after each batch
**Threshold:** `maxDiffPixels: 50, threshold: 0.1` (allows minor anti-aliasing differences)
**Viewports:** 375px (mobile), 768px (tablet), 1280px (desktop)
**Themes:** Both Town 77 and Playful Pastel

### Performance Monitoring
**Tool:** Chrome DevTools Performance panel + `window.performance` API
**Metrics:**
- Frame rate during animations (target: ≥ 55fps)
- Forced reflows (target: 0 during animation frames)
- First Contentful Paint (target: < 1.5s)
- Largest Contentful Paint (target: < 2.5s)
- Total blocking time (target: < 200ms)

### Accessibility Testing
**Tool:** axe-core automated checker + manual screen reader testing
**Checks:**
- Contrast ratios (target: ≥ 4.5:1 normal text, ≥ 3:1 large text)
- Focus indicators (all interactive elements)
- `prefers-reduced-motion` support
- Color-independent information conveyance
- Screen reader announcements for game state changes

### Cross-Browser Testing
**Tool:** Playwright multi-browser test suite
**Browsers:** Chrome, Firefox, Safari, Edge
**Checks:**
- Visual rendering consistency
- CSS property support (fallbacks where needed)
- Animation behavior consistency
- Touch interaction on mobile browsers

### Bundle Size Monitoring
**Tool:** `pnpm build` + bundle analyzer
**Budget:** Client bundle increase < 15KB gzipped
**Strategy:** Prefer CSS-only additions, share SVG defs, avoid new runtime dependencies

---

## Existing Patterns to Leverage

1. **Framer Motion `layout` prop** — Already used in `Chip.tsx` for layout animations. Can extend to `Hand.tsx` for chip reorder.

2. **`prefersReducedMotion()` hook** — Already exists in `lib/motion.ts`. All new animations must use this.

3. **Theme token injection** — `injectTokens()` already handles runtime CSS custom property updates. New tokens follow the same pattern.

4. **Test infrastructure** — Playwright E2E tests already capture screenshots. Visual regression tests extend this pattern.

5. **Component variant system** — `Chip`, `Cell`, `Hand`, `ActionBar` already support variants. New visual states can be added as variants.

---

## Landmines to Avoid

1. **Don't use `top`/`left` for animation** — Always use `transform` (GPU-accelerated). `top`/`left` cause layout thrashing.

2. **Don't add `box-shadow` to every element** — Shadows are expensive to paint. Use selectively (only elevated surfaces).

3. **Don't use `filter: drop-shadow()` on SVG** — It's slower than `<feDropShadow>` in SVG `<defs>`. Use SVG filters for SVG elements.

4. **Don't animate `width`/`height`** — Always animate `transform: scale()` instead. Width/height animations cause layout thrashing.

5. **Don't forget `prefers-reduced-motion`** — All animations must respect this. Test with `@media (prefers-reduced-motion: reduce)`.

6. **Don't hardcode colors in components** — All colors must use CSS custom properties. Hardcoded colors break theme switching.

7. **Don't duplicate SVG defs per chip** — Shared `<defs>` at `GameScreen` level. Per-chip defs multiply DOM size by chip count.

8. **Don't use `!important` in CSS** — Breaks theme token injection. Use CSS specificity instead.

---

*Phase: 08-frontend-design-x5*
*Research completed: 2026-06-10*
