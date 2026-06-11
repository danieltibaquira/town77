# Neobrutalism Theme Research — Town 77

## What is Neobrutalism?

Neobrutalism is a modern UI design trend that combines brutalist web design with playful, modern aesthetics. It's characterized by:

### Core Visual Principles
1. **Thick, heavy borders** — 3px+ solid black borders on everything
2. **Sharp, harsh shadows** — Offset shadows (no blur) in solid black, usually 4px-6px offset
3. **High contrast** — Black and white base with bright, clashing accent colors
4. **No gradients** — Solid colors only, no gradients
5. **Minimal or no rounded corners** — Sharp angles, 0px-4px border-radius maximum
6. **Bold, raw typography** — Heavy weights, blocky fonts
7. **Vibrant accent colors** — Hot pink, electric blue, bright yellow, neon green
8. **Intentional "unpolished" feel** — Not messy, but raw and honest
9. **No blur effects** — No backdrop-filter, no glassmorphism
10. **Playful offsets** — Cards and buttons slightly offset from their shadows

### Color Palette (Typical)
- Background: `#ffffff` (white) or `#f5f5f5` (off-white)
- Surface: `#000000` (black) or `#ffffff` (white)
- Text: `#000000` (black) on white, or `#ffffff` (white) on black
- Accents: `#ff6b6b` (hot pink), `#4ecdc4` (teal), `#ffe66d` (yellow), `#95e1d3` (mint)
- Borders: `#000000` (solid black, 3px+)
- Shadows: `#000000` (solid black, no blur)

### Shadow System
```css
/* Neobrutalism shadow */
box-shadow: 4px 4px 0px #000000;

/* On hover */
box-shadow: 6px 6px 0px #000000;

/* Active/pressed */
box-shadow: 2px 2px 0px #000000;
transform: translate(2px, 2px);
```

### Typography
- Font: Heavy sans-serif (Inter Black, Archivo Black, or system bold)
- Weights: 700-900 only
- Letter-spacing: Tight (0.02em or negative)
- Sizes: Large, bold, assertive

### Animation Style
- Snappy, immediate (0ms-150ms)
- No easing curves (linear or ease-out only)
- No bounce, no spring physics
- Direct, mechanical transitions
- Transform: translate on hover (not scale)

## Examples of Neobrutalism in the Wild
- **Linear.app** (elements of neobrutalism)
- **Figma** (some community files)
- **Gumroad** (used this style heavily)
- **Notion** (not neobrutalist, but inspired by simplicity)
- **Porkbun** (domain registrar, uses thick borders)
- **Brutalist Websites** (brutalistwebsites.com)

## How It Applies to Town 77

### Board Game Context
Board games are physical objects. Neobrutalism works well because it mimics the physicality of board games:
- Thick borders = card edges
- Sharp shadows = physical depth
- Bright colors = game pieces
- Raw textures = board surfaces

### Key Changes for Game Components

#### Grid/Board
- Thick black border around the grid
- Sharp offset shadow for depth
- Cells with heavy black borders
- No rounded corners

#### Chips
- Thick black outline
- Solid color fill (no gradient)
- Sharp shadow underneath
- White shape icon
- On hover: translate slightly, increase shadow

#### Buttons
- Thick black border
- Solid fill (white or accent)
- Sharp shadow
- On hover: translate into shadow (pressed effect)
- Active state: offset reduced

#### Cards/Containers
- Thick black border
- Sharp shadow
- No rounded corners
- Solid color background

## Implementation Strategy

### Approach: Theme Toggle
Create a new theme file `neobrutalism.ts` that overrides:
1. `colorPalette` — solid, bright colors
2. `surfaces` — white/off-white backgrounds
3. `fonts` — heavier weight
4. `animationPreset` — snappy, linear animations
5. Add `borderWidth` and `shadowOffset` to theme

### CSS Variables to Add
```css
--neo-border-width: 3px;
--neo-border-color: #000000;
--neo-shadow-offset: 4px;
--neo-shadow-color: #000000;
--neo-border-radius: 0px;
--neo-accent: #ff6b6b;
```

### Component Changes
Components need to read the theme and apply neobrutalist styles:
- `Chip.tsx` — thick border, solid fill, sharp shadow
- `Cell.tsx` — heavy black borders, solid colors
- `Grid.tsx` — thick container border
- `Button.tsx` — offset shadow, press effect
- `GameScreen.tsx` — white background, high contrast

### Toggle Mechanism
Add a theme toggle button to the home screen or settings:
- Store preference in localStorage
- Apply theme class to body
- Swap CSS variables

## Advantages for Town 77
1. **Accessibility** — High contrast, clear borders
2. **Playfulness** — Bright colors, tactile feel
3. **Distinctiveness** — Not another generic dark theme
4. **Physicality** — Matches board game feel
5. **Simplicity** — No gradients, no blur, straightforward

## Risks
1. **Polarizing** — Not everyone loves brutalism
2. **Mobile fit** — Thick borders take space on small screens
3. **Color clash** — Bright colors can feel overwhelming
4. **Professional feel** — Might look too "casual" for some users

## Decision: Make It a Toggle
Best approach: Make Neobrutalism an **alternate theme** that users can toggle.
- Default: Current refined dark theme
- Toggle: Neobrutalism (raw, bold, playful)
- Store preference in localStorage
- Apply via CSS class swap

## Implementation Plan

### Phase 1: Theme System Extension
1. Add `borderWidth`, `shadowOffset`, `shadowColor`, `borderRadius` to Theme interface
2. Create `neobrutalism.ts` theme file
3. Add theme toggle UI
4. Update `injectTokens()` to handle theme swap

### Phase 2: Component Adaptation
1. Update `Chip.tsx` to use theme borders/shadows
2. Update `Cell.tsx` to use theme borders/shadows
3. Update `Grid.tsx` to use theme borders/shadows
4. Update `Button.tsx` to use theme borders/shadows
5. Update `GameScreen.tsx` to use theme backgrounds

### Phase 3: Testing
1. Verify visual regression
2. Test both themes side by side
3. Test on mobile
4. Test accessibility (contrast)

## Color Palette Proposal

### Neobrutalism Palette
| Role | Color | Hex |
|---|---|---|
| Background | Off-white | `#f5f5f5` |
| Surface | White | `#ffffff` |
| Grid | White | `#ffffff` |
| Cell | Off-white | `#f0f0f0` |
| Cell Valid | Mint | `#95e1d3` |
| Cell Hover | Light gray | `#e0e0e0` |
| Text | Black | `#000000` |
| Text Secondary | Dark gray | `#333333` |
| Accent | Hot pink | `#ff6b6b` |
| Border | Black | `#000000` |
| Shadow | Black | `#000000` |

### Chip Colors (Bright, Solid)
| Chip | Color | Hex |
|---|---|---|
| Red | Hot pink | `#ff6b6b` |
| Blue | Electric | `#4ecdc4` |
| Green | Mint | `#95e1d3` |
| Yellow | Bright | `#ffe66d` |
| Pink | Magenta | `#f06292` |
| Purple | Lavender | `#b39ddb` |
| Orange | Tangerine | `#ffab91` |

## Shadow System
```css
/* Default state */
box-shadow: 4px 4px 0px #000000;

/* Hover state */
box-shadow: 6px 6px 0px #000000;

/* Active/pressed state */
box-shadow: 2px 2px 0px #000000;
transform: translate(2px, 2px);

/* Disabled state */
box-shadow: none;
border: 3px solid #666666;
```

## Border System
```css
/* Default border */
border: 3px solid #000000;

/* On dark backgrounds */
border: 3px solid #ffffff;

/* Focus state */
border: 3px solid #ff6b6b;
outline: none;
```

## Animation System
```css
/* Snappy, immediate */
transition: all 0.1s linear;

/* Hover: translate into shadow */
transform: translate(4px, 4px);
box-shadow: 0px 0px 0px #000000;

/* No easing, no bounce */
```

## Next Steps
1. Create `neobrutalism.ts` theme file
2. Extend shared-types to include border/shadow tokens
3. Add theme toggle to UI
4. Update components to read theme type
5. Test and iterate

---

*Research: Neobrutalism for Town 77*
*Date: 2026-06-11*
*Status: Complete, ready for planning*
