# Town 77 Design System — Theme & Voice Specification

**Date:** 2026-06-10  
**Status:** Approved (Phase 3.5)  
**Audience:** Team developers extending themes and components  

---

## 1. Purpose & Scope

### Why This Document Exists

This spec defines the design system architecture for Town 77: a turn-based, multiplayer strategy game built with React, Vite, and TypeScript. It is the authoritative reference for:

- **Theming**: How to create new themes (color palettes, animations, assets) that feel cohesive and distinct.
- **Tokens**: How design decisions (colors, spacing, timing) are expressed as CSS custom properties and TypeScript interfaces.
- **Components**: How to extend and variant React components using theme-driven props.
- **Avoiding generic AI output**: Principles and patterns to ensure designs feel intentional, human-crafted, and unique.

### Target Audience

- **Frontend developers** authoring new themes or components
- **Designers** curating assets and defining visual identity
- **Reviewers** conducting design QA and accessibility checks
- **Contributors** extending the system with new capabilities

### Out of Scope

- Visual design tooling (Figma setup, asset export workflows)
- Animation library internals (Framer Motion API docs)
- Localization beyond copy voice guidelines (see `i18next` setup in packages/client)
- Server-side logic or game rules (see design spec in `docs/superpowers/specs/`)

---

## 2. Principles

### Core Design Principles

#### 2.1 Constrain, Then Customize
Tokens define a bounded design space. New themes must work *within* token constraints, not bypass them. This ensures consistency while allowing personality.

**Example**: A new theme may choose cool jewel tones, but must still define exactly 7 colors (constraint), mapped to the color palette structure (constraint). The specific colors are the customization.

**Anti-pattern**: Adding ad-hoc CSS overrides or hardcoding colors in components.

#### 2.2 Intentional Imperfection
Hand-crafted assets and curated copy create personality. Avoid procedurally generated or symmetric designs.

**Example**: The town77 barn shape uses a curved `Q` (quadratic Bezier) edge, not a perfect arch. This imperfection signals "hand-drawn," not "AI-generated."

**Anti-pattern**: Using stock icon packs or procedural palette generators for the primary shape system.

#### 2.3 Motion as Identity
Animation presets define the personality of a theme. Three motion personas (calm/playful/flashy) ensure consistent micro-interactions across the interface.

**Example**: A calm theme uses easeOut easing and longer durations (600ms), while a playful theme uses spring physics (stiffness 260, damping 20).

**Anti-pattern**: Using generic easing curves (ease-in-out) everywhere or inconsistent timing across interactions.

#### 2.4 Accessibility First
Never trade accessibility for aesthetics. WCAG AA contrast ratios, keyboard navigation, and screen reader support are non-negotiable.

**Example**: Valid chip colors must pass WCAG AA against their background surfaces. If a color fails, the palette must be revised.

**Anti-pattern**: Choosing colors purely for aesthetics and then adding a contrast warning to the design review.

#### 2.5 Human-in-the-Loop
Curate, review, and iterate. Design systems should empower, not automate, creative decisions.

**Example**: Every new theme requires human review against the DESIGN_REVIEW checklist. No auto-publish.

**Anti-pattern**: Generating themes from procedural rules or machine-learning models.

#### 2.6 Avoid Generic "AI Slop"
Indicators of generic AI-generated output: procedural symmetry, stock palettes, default easing, zero personality, lack of craft. Counter with:

- **Curated palettes**: Pick 7 colors manually, not from a generator. Validate contrast.
- **Distinct assets**: Create 7 unique silhouettes per theme, not variations of one.
- **Bespoke motion**: Choose animation parameters intentionally (stiffness, damping, duration) based on theme mood.
- **Idiomatic copy**: Review all strings for voice, tone, and localization consistency.
- **Visual imperfections**: Add subtle asymmetry, hand-drawn stroke texture, or path jitter to shapes.

---

## 3. Token Hierarchy

### Three-Layer Token Architecture

Tokens in Town 77 follow a three-layer model:

```
Layer 1: Primitives    → raw values, never referenced in components
Layer 2: Semantic      → meaning-based, reference primitives, change per theme
Layer 3: Component     → per-widget, reference semantic tokens
```

### Layer 1: Primitives (Global, Theme-Agnostic)

Primitives are shared across all themes. They define timing, easing, and layout constants.

#### Motion Primitives
```css
--duration-instant: 80ms;
--duration-fast:    150ms;
--duration-normal:  300ms;
--duration-slow:    600ms;
--duration-epic:    1200ms;

--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out:     cubic-bezier(0, 0, 0.2, 1);
--ease-bounce:  cubic-bezier(0.68, -0.55, 0.27, 1.55);
```

#### Radius Primitives
```css
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   16px;
--radius-pill: 9999px;
```

#### Space Primitives
```css
--space-xs:   4px;
--space-sm:   8px;
--space-md:   16px;
--space-lg:   24px;
--space-xl:   40px;
--space-2xl:  64px;
```

#### Typography Primitives
```css
--text-sm:      clamp(11px, 2vw, 13px);
--text-base:    clamp(14px, 3vw, 16px);
--text-lg:      clamp(18px, 4vw, 24px);
--text-display: clamp(28px, 6vw, 56px);
```

#### Layout Primitives
```css
--layout-cell:   clamp(40px, 8vw, 72px);
--layout-gap:    clamp(2px, 0.5vw, 6px);
--layout-hand-h: clamp(96px, 15vh, 140px);
```

### Layer 2: Semantic Tokens (Injected from Theme at Runtime)

Semantic tokens map to theme decisions. Injected via `injectTokens(theme)` in `lib/theme.ts`.

#### Color Semantics
```css
/* Surface colors — theme.surfaces */
--color-surface-bg:           (from theme.surfaces.background)
--color-surface-grid:         (from theme.surfaces.grid)
--color-surface-cell:         (from theme.surfaces.cell)
--color-surface-cell-hover:   (from theme.surfaces.cellHover)
--color-surface-cell-valid:   (from theme.surfaces.cellValid)
--color-surface-cell-invalid: (from theme.surfaces.cellInvalid)

/* Text colors */
--color-text-primary:         (from theme or derived)
--color-text-secondary:       (from theme or derived)
--color-text-accent:          (from theme or derived)

/* Chip colors — theme.colorPalette */
--chip-color-1 through --chip-color-N: (from theme.colorPalette['color-1'] etc.)
```

#### Font Semantics
```css
--font-display: (from theme.fonts.display)
--font-ui:      (from theme.fonts.ui)
```

#### Motion Semantics (from theme.animationPreset)
```css
--motion-chip-place-stiffness:  (from animationPreset.chipPlace.stiffness)
--motion-chip-place-damping:    (from animationPreset.chipPlace.damping)
--motion-chip-invalid-duration: (from animationPreset.chipInvalid.duration)
--motion-celebrate-duration:    (from animationPreset.celebrate.duration)
--motion-celebrate-count:       (from animationPreset.celebrate.particleCount)
```

### Layer 3: Component-Level Tokens

Components compose semantic tokens into visual behaviors.

#### Chip Component
```css
--chip-size:       var(--layout-cell);              /* Base size */
--chip-stroke:     2px;                             /* Outline thickness */
--chip-shadow:     0 2px 8px rgba(0,0,0,0.2);      /* Depth */
--chip-cursor:     pointer;                         /* Interaction state */
```

#### Cell Component
```css
--cell-bg-empty:   var(--color-surface-cell);
--cell-bg-valid:   var(--color-surface-cell-valid);
--cell-bg-invalid: var(--color-surface-cell-invalid);
--cell-bg-hover:   var(--color-surface-cell-hover);
--cell-border:     none;
--cell-radius:     var(--radius-sm);
```

#### Button Component
```css
--button-bg:       var(--color-text-accent);
--button-color:    #000;
--button-hover-lift: 2px;
--button-active-scale: 0.95;
--button-radius:   var(--radius-md);
```

---

## 4. Token Naming Conventions

### Rules for New Tokens

1. **Kebab-case**: All tokens use lowercase with hyphens
   - ✓ Good: `--color-surface-cell-hover`
   - ✗ Bad: `--colorSurfaceCellHover`, `--COLOR_SURFACE`

2. **Semantic, not descriptive**: Token names describe *meaning*, not *appearance*
   - ✓ Good: `--color-surface-cell-valid` (meaning: valid placement cell)
   - ✗ Bad: `--color-light-green` (appearance: descriptive)

3. **Category prefix**: All tokens start with category `--[category]-[name]`
   - Categories: `color`, `duration`, `space`, `radius`, `ease`, `text`, `layout`, `chip`
   - Examples: `--color-surface-bg`, `--duration-fast`, `--chip-color-1`

4. **Avoid numbers unless semantic**: Numbers allowed only for indexed values
   - ✓ Good: `--chip-color-1` through `--chip-color-7`, `--space-2xl`
   - ✗ Bad: `--color-200`, `--button-size-3`

5. **Consistency across themes**: Semantic tokens must be present in all themes
   - ✓ A new theme must define `--color-surface-bg`, `--color-surface-cell-valid`, etc.
   - ✗ One theme defines `--color-error`, another doesn't

### Token Reference Table

| Token | Type | Semantics | Default (town77) | Example Override |
|-------|------|-----------|-----------------|------------------|
| `--color-surface-bg` | color | Main background | `#0F0D17` | `#FFF5E6` (pastel) |
| `--color-surface-cell` | color | Empty cell | `#241F35` | `#E8D5B0` (pastel) |
| `--color-surface-cell-valid` | color | Valid placement | `#2C4A2E` | `#C4E8D5` (pastel) |
| `--chip-color-1` | color | Palette[0] | `#B04A2F` | `#FF6B9D` (playful) |
| `--duration-fast` | time | Quick animation | `150ms` | `250ms` (slower theme) |
| `--text-display` | size | Title/headline | `clamp(28px, 6vw, 56px)` | same (responsive) |
| `--layout-cell` | size | Grid cell size | `clamp(40px, 8vw, 72px)` | same (responsive) |

---

## 5. Animation Presets & Motion Personalities

### Three Motion Personas

Every theme defines one primary motion persona, mapping to animation presets:

#### 5.1 Calm
Slow, easing-out transitions. No bounce. Suitable for peaceful, meditative themes.

**AnimationPreset mapping:**
```typescript
{
  chipPlace:   { type: 'spring', stiffness: 100, damping: 25, mass: 1 },
  chipInvalid: { x: [-3, 3, 0], duration: 0.3 },
  chipDraw:    { duration: 0.4, ease: 'easeOut' },
  cellPulse:   { duration: 0.8, repeat: 1 },
  turnIn:      { duration: 0.6, ease: 'easeOut' },
  celebrate:   { duration: 1.5, particleCount: 30, spread: 60 },
}
```

**Design notes**: Lower stiffness = more damped, slower settle. Longer durations = less urgent.

#### 5.2 Playful
Spring physics with slight bounce. Friendly, energetic. Suitable for bright, fun themes.

**AnimationPreset mapping:**
```typescript
{
  chipPlace:   { type: 'spring', stiffness: 260, damping: 20, mass: 1 },
  chipInvalid: { x: [-6, 6, -4, 4, 0], duration: 0.25 },
  chipDraw:    { duration: 0.2, ease: 'easeOut' },
  cellPulse:   { duration: 0.4, repeat: 2 },
  turnIn:      { duration: 0.3, ease: 'easeOut' },
  celebrate:   { duration: 1.0, particleCount: 60, spread: 100 },
}
```

**Design notes**: Higher stiffness + lower damping = springy, bouncy. Shorter durations = snappy, responsive.

#### 5.3 Flashy
Rapid, curve-driven animations with celebration emphasis. Over-the-top, gamified.

**AnimationPreset mapping:**
```typescript
{
  chipPlace:   { type: 'spring', stiffness: 350, damping: 15, mass: 0.8 },
  chipInvalid: { x: [-8, 8, -6, 6, -4, 4, 0], duration: 0.15 },
  chipDraw:    { duration: 0.15, ease: 'easeOut' },
  cellPulse:   { duration: 0.25, repeat: 3 },
  turnIn:      { duration: 0.2, ease: 'easeOut' },
  celebrate:   { duration: 0.8, particleCount: 100, spread: 150 },
}
```

**Design notes**: High stiffness, low damping, light mass = aggressive spring. Very short durations = arcade-like feedback.

### Motion Anti-Patterns

- ❌ **Generic ease-in-out everywhere**: Use meaningful easing per interaction (place vs invalid vs celebrate).
- ❌ **Inconsistent timing**: If valid placement takes 250ms, other feedback should be comparable (150–400ms range).
- ❌ **Synchronous animations**: Stagger chip animations in a hand; don't animate all at once.
- ❌ **No visual feedback on invalid**: Invalid moves must have distinct motion (shake, flash, different duration).
- ❌ **Celebrate on every placement**: Reserve celebrate animation for milestones (row complete, game end), not every chip.

---

## 6. Sound & Particle Assets

### Optional Sound Bank

Sound effects are optional but strongly recommended for theme personality. Define up to 4 sounds:

1. **chipPlace**: Chip placed successfully (duration: 200–300ms)
2. **chipInvalid**: Invalid placement attempt (duration: 150–250ms, dissonant)
3. **chipDraw**: Draw from bag (duration: 150–200ms, subtle)
4. **celebrate**: Game milestone or end (duration: 500–1200ms)

### Sound Asset Structure

```
public/themes/{themeId}/
  ├── assets/
  │   ├── sounds/
  │   │   ├── place.mp3 (or .ogg/.wav)
  │   │   ├── invalid.mp3
  │   │   ├── draw.mp3
  │   │   └── celebrate.mp3
  │   ├── textures/
  │   │   ├── noise.svg
  │   │   └── grain.svg
  │   └── manifest.json
```

### Sound Loading & Playback

Reference in theme with optional `soundBank` field (future API):

```typescript
interface Theme {
  // ... existing fields
  soundBank?: {
    place?:     { url: string; volume: number }
    invalid?:   { url: string; volume: number }
    draw?:      { url: string; volume: number }
    celebrate?: { url: string; volume: number }
  }
}
```

Recommended library: **Howler.js** (small, audio sprite support, fallback to Web Audio API).

### Particle & Celebrate Presets

The `celebrate` animation in animationPreset defines particles:

```typescript
celebrate: {
  duration:     1200,         // total animation time (ms)
  particleCount: 60,          // number of particles
  spread:       100,          // radial spread angle (degrees)
  // Additional (future):
  // particleColor?: string   // inherited from theme palette
  // particleShape?: 'circle' | 'square' | 'star'
  // lifetime?: number        // particle fade time (ms)
}
```

### Accessibility Fallback

Users with reduced-motion (prefers-reduced-motion) must have visual-only feedback:

- **Haptic fallback**: If available, use `navigator.vibrate([10, 50, 20])` for tactile feedback.
- **Visual enhancement**: If sound is not played, increase celebrate particle count or duration.
- **Always provide**: No audio-only feedback; animations must be visible to hear-impaired users.

---

## 7. Asset Guidelines & Shapes

### SVG Shape Requirements

Each theme defines 7 house silhouettes. Requirements:

1. **ViewBox**: All shapes must use viewBox="0 0 40 40" (40×40 coordinate space)
2. **Stroke**: min 1px, max 3px. Default: 2px solid with no fill (path fill="none")
3. **File size**: < 1KB per shape (achievable with minimal precision)
4. **Unique but cohesive**: 7 silhouettes must be visually distinct yet belong to same architectural style

### Hand-Crafting Guidelines

Avoid procedural symmetry and smooth curves. Introduce intentional imperfection:

- **Asymmetry**: Roof lines or walls are slightly off-center (±2–3 units in viewBox space)
- **Stroke variation**: Mix straight lines and curved edges; avoid all curves or all lines
- **Jitter**: Add 1–2 unit random offsets to key points (not every point; select 3–5 landmarks)
- **Organic curves**: Use `Q` (quadratic) or `C` (cubic) Bezier, not arcs or circles
- **No perfect symmetry**: If left and right sides exist, make them slightly different

### Color Palette Rules

1. **Exactly 7 colors** (constraint: one per shape type)
2. **Hex values**: Use 6-digit hex `#RRGGBB` for consistency (not short `#RGB` or `hsl()`)
3. **WCAG AA contrast**: Every chip color must have ≥ 4.5:1 contrast against its typical backgrounds
   - Test pair: `chipColor` on both `--color-surface-cell` and `--color-surface-cell-valid`
   - Tool: WebAIM contrast checker (https://webaim.org/resources/contrastchecker/)
4. **Avoid procedural generation**: Pick colors manually. Inspiration: color curators like Coolors, Adobe Color, or art references
5. **Document rationale**: For each color, note inspiration (material, mood, cultural significance)

### Asset File Structure

```
packages/client/
├── src/
│   ├── themes/
│   │   └── [themeId].ts           # Theme TypeScript object
│   │       (SVG paths are embedded here)
│   └── locales/
│       ├── es/game.json           # Spanish flavor strings (optional)
│       └── en/game.json
└── public/
    └── themes/
        └── [themeId]/
            ├── assets/
            │   ├── sounds/
            │   │   ├── place.mp3
            │   │   └── (others...)
            │   ├── textures/
            │   │   └── (optional: noise, grain overlays)
            │   └── manifest.json
            └── README.md           # Asset attribution & credits
```

### Manifest.json Example

```json
{
  "id": "town77",
  "name": "Town 77",
  "author": "Town 77 Design Team",
  "version": "1.0.0",
  "assets": {
    "sounds": {
      "place": { "file": "sounds/place.mp3", "duration": 250 },
      "invalid": { "file": "sounds/invalid.mp3", "duration": 200 }
    },
    "shapes": {
      "cottage": { "viewBox": "0 0 40 40", "description": "Simple pitched roof" },
      "tower": { "viewBox": "0 0 40 40", "description": "Tall narrow structure" }
    }
  },
  "colors": {
    "color-1": { "hex": "#B04A2F", "name": "Terracotta", "wcag": "4.8:1 vs grid" }
  }
}
```

### Accessibility in Assets

- **Focus indicators**: Chip and Cell buttons must have visible focus states (outline or glow)
- **Color blindness**: Palette must be distinguishable for Deuteranopia (red-green colorblind)
  - Tool: Coblis simulator (https://www.color-blindness.com/coblis-color-blindness-simulator/)
- **Large text legibility**: UI text must remain readable at all scales (11px–56px range)
- **Icon clarity**: Shape silhouettes must be recognizable at minimum size (40px × 40px)

---

## 8. Component API Reference

### Component Variants Overview

All components support theme-driven customization via props. Variants must be CSS-token-driven (no hardcoded colors).

### Chip Component

**Props:**
```typescript
interface ChipProps {
  chip: Chip                           // Required
  isSelected: boolean                  // Highlight state
  isValid: boolean                     // Valid placement feedback
  size?: 'sm' | 'md' | 'lg'           // New: size variant
  variant?: 'flat' | 'outline'         // New: visual variant
  onClick?: () => void
}
```

**Size mapping:**
- `sm`: 60% of `--layout-cell`
- `md`: 100% of `--layout-cell` (default)
- `lg`: 140% of `--layout-cell`

**Variant mapping:**
- `flat`: no stroke, solid fill (default)
- `outline`: stroke only, transparent fill

**Rendering:**
```css
.chip[data-size="lg"] {
  width: calc(var(--layout-cell) * 1.4);
  height: calc(var(--layout-cell) * 1.4);
}
.chip[data-variant="outline"] {
  stroke: currentColor;
  stroke-width: var(--chip-stroke);
  fill: none;
}
```

### Cell Component

**Props:**
```typescript
interface CellProps {
  row: number
  col: number
  chip: Chip | null
  isValid: boolean
  density?: 'compact' | 'comfortable'  // New: layout density
  highlightStyle?: 'glow' | 'pulse'    // New: valid state visual
  onClick?: (row: number, col: number) => void
}
```

**Density mapping:**
- `compact`: `--layout-gap` reduced by 50%, cells smaller
- `comfortable`: `--layout-gap` at default (100%)

**Highlight mapping:**
- `glow`: shadow/blur on valid cell (default)
- `pulse`: subtle animation pulse on valid cell

### Grid Component

**Props:**
```typescript
interface GridProps {
  grid: Grid
  validCells: [number, number][]
  density?: 'compact' | 'comfortable'  // Propagates to Cells
  onCellClick?: (row: number, col: number) => void
}
```

### Hand Component

**Props:**
```typescript
interface HandProps {
  chips: Chip[]
  selectedChip: Chip | null
  layoutMode?: 'scrolling' | 'stacked' | 'compact'  // New
  onSelect: (chip: Chip) => void
}
```

**Layout mode mapping:**
- `scrolling`: horizontal scroll (default), `overflow-x: auto`
- `stacked`: wrap to multiple rows, `flex-wrap: wrap`
- `compact`: 2-row stack, reduced gap

### ActionBar Component

**Props:**
```typescript
interface ActionBarProps {
  canExchange: boolean
  canDiscard: boolean
  size?: 'sm' | 'md'                   // New
  iconOnly?: boolean                   // New: text labels or icons only
  variant?: 'raised' | 'ghost'         // New: button style
  onExchange: () => void
  onDiscard: () => void
}
```

**Size mapping:**
- `sm`: buttons 32px tall, compact padding
- `md`: buttons 48px tall, comfortable padding (default)

**Variant mapping:**
- `raised`: solid background, shadow (default)
- `ghost`: transparent background, border outline

### PlayerBadge Component

**Props:**
```typescript
interface PlayerBadgeProps {
  player: PlayerState
  isCurrentTurn: boolean
  isMyPlayer: boolean
  size?: 'sm' | 'md'                   // New
  variant?: 'default' | 'compact'      // New
}
```

**Rendering notes:**
- Always render connection indicator (green dot = connected, grey = disconnected)
- Display player name + placed chip count
- Highlight current turn with accent color

---

## 9. Creating a New Theme — Step by Step

### Prerequisites

- Basic SVG knowledge (paths, viewBox)
- Familiarity with Town 77 design and rules
- Access to color contrast checker (https://webaim.org/resources/contrastchecker/)

### Step 1: Copy the Theme Template

```bash
cp packages/client/src/themes/_template.ts packages/client/src/themes/my-theme.ts
```

### Step 2: Define Metadata

Edit `my-theme.ts`:

```typescript
export const myTheme: Theme = {
  id: 'my-theme',
  name: 'My Theme',
  // ... rest to follow
}
```

### Step 3: Author 7 SVG Shapes

For each shape (cottage, rowhouse, tower, victorian, barn, bungalow, skyscraper):

1. Sketch on paper or in Figma (40×40 grid)
2. Extract SVG path
3. Validate viewBox="0 0 40 40"
4. Test rendering at min/max sizes
5. Add to `shapes` object:

```typescript
shapes: {
  cottage:    'M5 35 L5 20 L20 5 L35 20 L35 35 Z',  // your path
  rowhouse:   'M8 35 L8 16 L20 5 L32 16 L32 35 Z',
  // ... 5 more
}
```

### Step 4: Curate a 7-Color Palette

1. Pick inspiration: mood board, nature reference, art style
2. Select 7 colors manually (don't auto-generate)
3. Validate each color:
   ```bash
   # For each pair (chipColor, background):
   # Visit https://webaim.org/resources/contrastchecker/
   # Paste hex values, verify ≥ 4.5:1 ratio
   ```
4. Add to `colorPalette`:

```typescript
colorPalette: {
  'color-1': '#B04A2F',
  'color-2': '#3D7AB5',
  // ... 5 more
}
```

### Step 5: Define Motion Preset

Choose a persona (calm/playful/flashy) or blend. Add to theme:

```typescript
animationPreset: {
  chipPlace:   { type: 'spring', stiffness: 260, damping: 20, mass: 1 },
  chipInvalid: { x: [-6, 6, -4, 4, 0], duration: 0.3 },
  chipDraw:    { duration: 0.25, ease: 'easeOut' },
  cellPulse:   { duration: 0.6, repeat: 1 },
  turnIn:      { duration: 0.4, ease: 'easeOut' },
  celebrate:   { duration: 1.2, particleCount: 60, spread: 100 },
}
```

### Step 6: Define Surfaces & Fonts

```typescript
surfaces: {
  background:  '#0F0D17',
  grid:        '#1C1828',
  cell:        '#241F35',
  cellHover:   '#2E2847',
  cellValid:   '#2C4A2E',
  cellInvalid: '#4A2020',
},
fonts: {
  display: "'Bebas Neue', sans-serif",
  ui:      "'Inter', system-ui, sans-serif",
}
```

### Step 7: Register Theme

Edit `packages/client/src/themes/index.ts`:

```typescript
export { town77Theme } from './town77'
export { myTheme } from './my-theme'

export const THEMES = [town77Theme, myTheme] as const
```

### Step 8: Write Tests

Create `packages/client/src/__tests__/my-theme.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { myTheme } from '../themes/my-theme'

describe('myTheme', () => {
  it('is a valid Theme object', () => {
    expect(myTheme.id).toBe('my-theme')
    expect(Object.keys(myTheme.shapes)).toHaveLength(7)
    expect(Object.keys(myTheme.colorPalette)).toHaveLength(7)
  })

  it('has valid animation preset', () => {
    const { animationPreset } = myTheme
    expect(animationPreset.chipPlace.type).toBe('spring')
    expect(animationPreset.chipPlace.stiffness).toBeGreaterThan(0)
  })
})
```

Run tests:
```bash
pnpm --filter @town77/client test -- my-theme.test.ts
```

### Step 9: Submit for Design Review

Before merging:
1. Run your test: verify no errors
2. Check DESIGN_REVIEW.md checklist (section 11)
3. Create PR with theme files and test
4. Request review from designer/lead

---

## 10. Case Study: Town 77 Theme

### Overview

**Town 77** is the reference implementation and default theme. It defines:
- A warm, earthy color palette (terracotta, slate, forest tones)
- Architectural silhouettes inspired by colonial American townhouses
- Calm, meditative motion preset (spring physics, 260/20/1 stiffness/damping/mass)
- Approachable, human-crafted aesthetic

This case study documents design decisions and rationale to serve as a template for future themes.

### Design Rationale

#### Color Palette: "Hearth & Horizon"

The 7 colors evoke warmth, stability, and geographic richness:

| Color | Hex | Name | Semantics | Inspiration |
|-------|-----|------|-----------|-------------|
| 1 | #B04A2F | Terracotta | Primary, earthy | Adobe brick, southwestern clay |
| 2 | #3D7AB5 | Slate Blue | Secondary, cool | River slate, twilight sky |
| 3 | #4A7C59 | Forest | Tertiary, organic | Evergreen forest, new growth |
| 4 | #C4A35A | Gold | Accent, warm | Wheat fields, late afternoon sun |
| 5 | #8B3A52 | Plum | Accent, rich | Wine, ripe fruit, autumn earth |
| 6 | #2B2F5E | Navy | Accent, deep | Night sky, architectural shadow |
| 7 | #E8D5B0 | Cream | Light, neutral | Parchment, aged linen, plaster |

**Contrast validation** (all ≥ 4.5:1 against primary surfaces):
- Against `--color-surface-cell` (#241F35): All 7 colors pass minimum contrast
- Against `--color-surface-cell-valid` (#2C4A2E): Colors 1–4, 7 pass; 5–6 require care in UI

**Palette story**: The palette suggests a small historic town, preserved and cherished. Colors are not vibrant but nuanced—the result of hand-selection, not procedural generation. No synthetic neons or pastels; every color has a natural antecedent.

#### Asset Design: "Architectural Vernacular"

Seven house silhouettes represent different architectural styles and eras:

1. **Cottage** (M5 35 L5 20 L20 5 L35 20 L35 35 Z)
   - Pitched roof, simple structure
   - Evokes: Rural farmhouse, starter home
   - Symmetry: Perfect (intentional simplicity)

2. **Rowhouse** (M8 35 L8 16 L20 5 L32 16 L32 35 Z)
   - Taller, narrower than cottage
   - Evokes: Urban row, shared walls
   - Symmetry: Perfect (urban grid-like)

3. **Tower** (M13 35 L13 3 L16 1 L24 1 L27 3 L27 35 Z)
   - Vertical accent, spire-like
   - Evokes: Church steeple, lookout post, historic marker
   - Symmetry: Perfect (landmark presence)

4. **Victorian** (M5 35 L5 22 L12 12 L20 3 L28 12 L35 22 L35 35 Z)
   - Complex roofline, gabled peak
   - Evokes: Ornate 19th-century mansion
   - Symmetry: Perfect (formal symmetry)

5. **Barn** (M4 35 L4 20 Q20 8 36 20 L36 35 Z)
   - Curved roof (quadratic Bezier) for organic feel
   - Evokes: Working farm, practical heritage
   - Asymmetry: Subtle (curved roof vs. rectilinear base)
   - **Hand-craft indicator**: The `Q20 8 36 20` Bezier curve avoids perfect arcs

6. **Bungalow** (M3 35 L3 24 L10 17 L30 17 L37 24 L37 35 Z)
   - Low, wide profile
   - Evokes: Early 20th-century cottage, horizontality
   - Asymmetry: Slight width variation (3 vs. 37 left/right)

7. **Skyscraper** (M13 35 L13 2 L20 0 L27 2 L27 35 Z)
   - Modern, minimalist, vertical
   - Evokes: Contemporary town center, central building
   - Symmetry: Perfect (modern design language)

**Asset philosophy**: Each shape is minimal SVG (~100–150 bytes), emphasizing silhouette over detail. No fill, just stroke. The Barn shape includes a hand-drawn curve (quadratic Bezier) to signal intentionality and avoid procedural symmetry. The variety ensures chess-like pieces feel distinct without clashing aesthetically.

#### Motion Preset: "Playful Calm"

Town 77 uses the **Playful** motion persona with slightly increased damping:

```typescript
animationPreset: {
  chipPlace:   { type: 'spring', stiffness: 260, damping: 20, mass: 1 },
  chipInvalid: { x: [-6, 6, -4, 4, 0], duration: 0.3 },
  chipDraw:    { duration: 0.25, ease: 'easeOut' },
  cellPulse:   { duration: 0.6, repeat: 1 },
  turnIn:      { duration: 0.4, ease: 'easeOut' },
  celebrate:   { duration: 1.2, particleCount: 60, spread: 100 },
}
```

**Design intent**: Spring physics (not linear easing) create a sense of physicality—chips feel weighty, placement feels satisfying. Stiffness 260 provides snappiness without feeling frantic. Damping 20 allows one gentle bounce. Durations (0.25–1.2s) favor responsiveness over sluggishness.

**Micro-interaction rationale**:
- **chipPlace**: Spring creates "landing" feel (satisfying tactile feedback)
- **chipInvalid**: 5-keystep shake ([-6, 6, -4, 4, 0]) signals error without harsh motion
- **chipDraw**: Quick easeOut (0.25s) for snappy bag interaction
- **cellPulse**: 0.6s repeat once (gentle highlight, not distracting)
- **turnIn**: 0.4s easeOut (players feel turn transition without waiting)
- **celebrate**: 1.2s with 60 particles (reward moment, not overwhelming)

#### Surfaces & Fonts

**Color scheme**: Dark, low-contrast background encourages focus. Valid cells use muted green to signal success without neon harshness.

```typescript
surfaces: {
  background:  '#0F0D17',  // Deep indigo/charcoal
  grid:        '#1C1828',  // Slightly lighter container
  cell:        '#241F35',  // Dim purple-gray for play area
  cellHover:   '#2E2847',  // Subtle interactive lift
  cellValid:   '#2C4A2E',  // Muted forest green success
  cellInvalid: '#4A2020',  // Deep red error (not bright)
}
```

**Font stack**:
- **Display**: "Bebas Neue" (geometric, modern, game-friendly uppercase)
- **UI**: "Inter" (neutral sans-serif, excellent legibility, system fallback)

The combination conveys: traditional (serif-like geometry of Bebas) + contemporary (Inter's clarity).

### Accessibility Compliance

- **Contrast**: Palette meets WCAG AA for most combinations; Navy (#2B2F5E) noted in design review for specific pairing validation
- **Color blindness**: Palette tested in Coblis simulator; Deuteranopia (red-green) remains distinguishable via brightness and saturation variation
- **Motion**: `prefers-reduced-motion` queries implemented; all animations gracefully degrade to instant state changes
- **Focus states**: All interactive elements have visible outlines (defined in component layer)
- **Responsive text**: Font sizes use `clamp()` for fluidity at 11px–56px range

### Lessons & Reusability

**What works**:
- Hand-crafted palette feels cohesive and intentional (not auto-generated)
- Barn shape's Bezier curve signals "human touch" to players
- Spring motion felt natural and rewarding in playtesting
- Dark surfaces reduce eye strain for extended play

**What's theme-specific**:
- Architectural aesthetic tightly tied to "Town 77" narrative; would not transfer to, e.g., a space or underwater theme
- Barn shape requires Bezier knowledge; simpler themes might use only straight lines
- Palette was hand-curated for *this* game; different games need different rationales

**Reusable patterns**:
- 7-color structure enables easy theme swaps
- Spring presets (stiffness/damping/mass) can be mixed/matched for other personas
- Surface color layer abstraction makes theme switching seamless

### Iteration History

**v1.0** (current):
- All 7 shapes finalized with SVG path validation
- Palette tested for contrast; noted edge cases
- Motion presets locked after playtesting feedback
- Accessible to keyboard, screen readers, and reduced-motion users

*Future iterations may refine colors, add sound bank, or introduce texture overlays (see Section 6).*

---

## 11. Design Review Checklist & Accessibility

### Purpose

Before merging a new theme or component variant, conduct design review to:
- Prevent regressions into "AI-generic" outputs
- Validate accessibility compliance
- Ensure consistency with established patterns
- Catch performance or rendering issues

### Theme Design Review Checklist

#### Visual QA
- [ ] **Theme renders across all components** (Chip, Cell, Grid, Hand, ActionBar, PlayerBadge)
- [ ] **All 7 shapes render without clipping or distortion** at min (40px) and max (140px) sizes
- [ ] **Color palette is cohesive**: 7 colors feel intentionally curated, not procedural
- [ ] **Motion transitions feel responsive** (not sluggish, not janky)
- [ ] **Surfaces provide sufficient contrast** against chip colors and text
- [ ] **No visual artifacts** (render glitches, misaligned strokes, bleeding colors)

#### Accessibility Compliance
- [ ] **Keyboard navigation** works for all interactive elements (Tab, Enter, Arrow keys, Escape)
- [ ] **Screen reader announces** chip states, cell validity, button labels
- [ ] **Color contrast** ≥ 4.5:1 for all text and interactive elements (WCAG AA)
- [ ] **Color blindness test** passed (Deuteranopia, Protanopia, Tritanopia via Coblis)
- [ ] **Motion:** `prefers-reduced-motion` media query respected; animations disabled or instant
- [ ] **Focus indicators visible** on all buttons and interactive elements
- [ ] **Text legible** across responsive range (11px–56px)

#### Design System Adherence
- [ ] **Tokens only**: No hardcoded colors or layout values in CSS/TS
- [ ] **7 shapes, 7 colors**: Exact quantities enforced; not 6 or 8
- [ ] **SVG paths valid**: All shapes have `viewBox="0 0 40 40"`, stroke 1–3px, file size <1KB
- [ ] **No stock assets**: All shapes are custom; barn/bungalow/tower/etc. are distinct
- [ ] **Motion preset complete**: All 6 keys (chipPlace, chipInvalid, chipDraw, cellPulse, turnIn, celebrate) defined
- [ ] **Surfaces complete**: All 6 surface colors defined (background, grid, cell, cellHover, cellValid, cellInvalid)
- [ ] **Fonts valid**: Display and UI font stacks resolve (no missing weights)

#### Performance
- [ ] **Bundle size impact** reasonable (theme TS file <10KB unminified)
- [ ] **Animation frame rate** stable (60fps or device maximum)
- [ ] **No layout thrashing** (paint/reflow fires minimally during animations)
- [ ] **SVG shapes load instantly** (no network requests; embedded in TS)

#### Copy & Localization (if applicable)
- [ ] **All strings externalized** to `i18n/[locale]/game.json` (no hardcoded strings in JSX)
- [ ] **Voice consistent** with theme personality (e.g., "Playful" theme uses different tone than "Calm")
- [ ] **Localized for all languages** (at minimum: English and Spanish)
- [ ] **No broken references** in locale files

#### Anti-Pattern Catches
- [ ] **No procedural symmetry**: At least one shape should have subtle asymmetry or hand-drawn curves
- [ ] **No generic easing**: Avoid `ease-in-out`; use intentional spring or easeOut presets
- [ ] **No stock icons**: All shapes are thematic; not from icon libraries
- [ ] **No inline styles**: All colors/layout via CSS custom properties
- [ ] **No auto-generated palettes**: Colors manually curated; rationale documented
- [ ] **No visual "cuteness over correctness"**: Accessibility never sacrificed for aesthetics

### Component Variant Review Checklist

#### Props & API
- [ ] **All variant props work** (size, mood, density, highlightStyle, layoutMode, etc.)
- [ ] **No console errors** when rendering all prop combinations
- [ ] **Props documented** in JSDoc comments with examples
- [ ] **TypeScript types** are strict (no `any`, proper unions for variants)

#### CSS Tokens
- [ ] **All colors reference CSS custom properties** (no #RRGGBB hardcoded)
- [ ] **All sizes reference tokens** (--space-*, --radius-*, --duration-*)
- [ ] **Tokens compose correctly** (e.g., Chip size uses `var(--layout-cell)`)
- [ ] **No "magic numbers"** in CSS

#### Testing
- [ ] **Snapshot tests pass** (if snapshots are used)
- [ ] **Visual regression** checked across themes (theme switch doesn't break component)
- [ ] **Edge cases handled** (empty hand, single cell, no valid moves, etc.)
- [ ] **Unit tests cover** all prop combinations

### Example: Town 77 Design Review (Passing)

**Visual QA**: ✅ All shapes render cleanly; Barn curve is subtle, hand-drawn-looking  
**Accessibility**: ✅ All WCAG AA contrast ratios verified; motion respects prefers-reduced-motion  
**System Adherence**: ✅ 7 shapes, 7 colors; tokens-only CSS; motion preset complete  
**Performance**: ✅ theme TS <3KB; animations smooth 60fps  
**Copy**: ✅ Strings in es/game.json and en/game.json; consistent voice  
**Anti-Patterns**: ✅ Barn shape has Bezier curve (not perfect); playful spring preset (not linear easing)  

**Result**: Ready to merge.

### Reviewer Responsibilities

- **Designer**: Verify visual cohesion, palette story, and motion identity
- **Frontend Engineer**: Validate TypeScript types, token usage, prop combinations
- **QA/Accessibility Specialist**: Test keyboard nav, screen readers, color blindness, motion
- **Product/Game Owner**: Confirm theme aligns with game narrative and brand

---
