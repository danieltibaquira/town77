# Neobrutalism Theme — Implementation Plan

## Overview
Create a Neobrutalism theme for Town 77 as a toggleable alternative to the current refined dark theme. Users can switch between "Refined" (current) and "Neobrutalism" (new) via a theme toggle.

## Goals
- Add a new Neobrutalism theme without breaking the existing design
- Make it a drop-in toggle, not a replacement
- Keep both themes functional and tested
- Store user preference in localStorage

## Technical Approach

### 1. Theme System Extension

**Add to shared-types:**
```typescript
interface Theme {
  id: string;
  name: string;
  style: "refined" | "neobrutalism"; // NEW
  shapes: Record<ShapeId, string>;
  colorPalette: Record<ColorId, string>;
  surfaces: ThemeSurfaces;
  fonts: ThemeFonts;
  animationPreset: AnimationPreset;
  // NEW properties
  borderWidth: number;
  shadowOffset: number;
  shadowColor: string;
  borderRadius: number;
  borderColor: string;
}
```

**Add to theme.ts:**
```typescript
export function useThemeStyle() {
  const { theme } = useTheme();
  return theme.style === "neobrutalism" ? "neo" : "refined";
}
```

### 2. Create Neobrutalism Theme

**File:** `packages/client/src/themes/neobrutalism.ts`

```typescript
export const neobrutalismTheme: Theme = {
  id: "neobrutalism",
  name: "Neo",
  style: "neobrutalism",
  shapes: { /* same shapes */ },
  colorPalette: {
    "color-1": "#ff6b6b",
    "color-2": "#4ecdc4",
    "color-3": "#95e1d3",
    "color-4": "#ffe66d",
    "color-5": "#f06292",
    "color-6": "#b39ddb",
    "color-7": "#ffab91",
  },
  surfaces: {
    background: "#f5f5f5",
    grid: "#ffffff",
    cell: "#f0f0f0",
    cellHover: "#e0e0e0",
    cellValid: "#95e1d3",
    cellInvalid: "#ff6b6b",
  },
  fonts: {
    display: "'Archivo Black', 'Inter', sans-serif",
    ui: "'Inter', sans-serif",
  },
  animationPreset: {
    chipPlace: { type: "spring", stiffness: 500, damping: 30, mass: 1 },
    chipInvalid: { x: [-8, 8, 0], duration: 0.1 },
    chipDraw: { duration: 0.1, ease: "linear" },
    cellPulse: { duration: 0.2, repeat: 1 },
    turnIn: { duration: 0.15, ease: "linear" },
    celebrate: { duration: 0.5, particleCount: 30, spread: 50 },
    // ... rest are snappy
  },
  borderWidth: 3,
  shadowOffset: 4,
  shadowColor: "#000000",
  borderRadius: 0,
  borderColor: "#000000",
};
```

### 3. CSS Variable System

**Add to tokens.css:**
```css
/* Neobrutalism overrides */
[data-theme="neobrutalism"] {
  --neo-border: 3px solid #000000;
  --neo-shadow: 4px 4px 0px #000000;
  --neo-shadow-hover: 6px 6px 0px #000000;
  --neo-shadow-active: 2px 2px 0px #000000;
  --neo-radius: 0px;
  --neo-transition: all 0.1s linear;
}
```

### 4. Component Changes

Each component needs to read the theme style and apply appropriate styling:

**Chip.tsx:**
```typescript
const isNeo = theme.style === "neobrutalism";

style={{
  border: isNeo ? "3px solid #000000" : "none",
  boxShadow: isNeo ? "4px 4px 0px #000000" : "0 2px 4px rgba(0,0,0,0.2)",
  borderRadius: isNeo ? "0px" : "var(--radius-md)",
  // ...
}}
```

**Cell.tsx:**
```typescript
style={{
  border: isNeo ? "3px solid #000000" : "1px solid rgba(255,255,255,0.04)",
  boxShadow: isNeo ? "4px 4px 0px #000000" : "inset 0 1px 2px rgba(0,0,0,0.3)",
  borderRadius: isNeo ? "0px" : "var(--radius-md)",
  // ...
}}
```

**Button components:**
```typescript
// On hover for neobrutalism
transform: isNeo ? "translate(4px, 4px)" : "scale(1.02)",
boxShadow: isNeo ? "0px 0px 0px #000000" : "var(--shadow-md)",
```

### 5. Theme Toggle UI

**Add to HomeScreen or ConfigScreen:**
```typescript
<button onClick={() => setTheme(theme.id === "town77" ? "neobrutalism" : "town77")}>
  {theme.id === "town77" ? "🎨 Neo Mode" : "🌙 Refined"}
</button>
```

### 6. Implementation Order

**Phase 1: Foundation (30 min)**
1. Extend Theme type in shared-types
2. Create neobrutalism.ts theme file
3. Register in theme index
4. Add theme toggle to UI
5. Update injectTokens to set data-theme attribute

**Phase 2: Components (60 min)**
1. Update Chip.tsx with neo styling
2. Update Cell.tsx with neo styling
3. Update Grid.tsx with neo styling
4. Update ActionBar.tsx with neo styling
5. Update HomeScreen.tsx with neo styling
6. Update GameScreen.tsx with neo styling

**Phase 3: Polish (30 min)**
1. Add hover/pressed states for neo buttons
2. Test both themes side by side
3. Verify accessibility (contrast)
4. Test on mobile

## Testing Strategy

### Visual Tests
- Screenshot both themes at 3 viewports
- Verify chips are visible in both
- Verify valid cells are distinct
- Verify buttons are clickable

### Functional Tests
- Theme toggle persists across page reload
- Theme applies to all screens
- Game logic unchanged
- Animations work in both themes

### Accessibility Tests
- Contrast ratios ≥ 4.5:1 in both themes
- Focus indicators visible
- No color-only information

## Files to Create
- `packages/shared-types/src/theme.ts` (extend)
- `packages/client/src/themes/neobrutalism.ts` (new)
- `packages/client/src/themes/index.ts` (update)
- `packages/client/src/lib/theme.ts` (update)

## Files to Modify
- `packages/client/src/components/Chip.tsx`
- `packages/client/src/components/Cell.tsx`
- `packages/client/src/components/Grid.tsx`
- `packages/client/src/components/ActionBar.tsx`
- `packages/client/src/components/PlayerBadge.tsx`
- `packages/client/src/components/Hand.tsx`
- `packages/client/src/screens/HomeScreen.tsx`
- `packages/client/src/screens/ConfigScreen.tsx`
- `packages/client/src/screens/GameScreen.tsx`
- `packages/client/src/screens/LobbyScreen.tsx`
- `packages/client/src/screens/ResultsScreen.tsx`
- `packages/client/src/styles/tokens.css` (add neo vars)

## Success Criteria
- [ ] Both themes render correctly
- [ ] Theme toggle works instantly
- [ ] Preference persists across reloads
- [ ] All existing tests pass
- [ ] New visual tests for both themes
- [ ] Mobile responsive
- [ ] Accessibility compliant

## Time Estimate
- **Total:** ~2-3 hours
- **Phase 1:** 30 min
- **Phase 2:** 90 min
- **Phase 3:** 30 min
- **Testing:** 30 min

## Risks
- **Bundle size:** Minimal, just one new theme file
- **Performance:** No impact, just CSS changes
- **Maintenance:** Need to update both themes when adding components
- **User confusion:** Clear toggle UI mitigates this

## Decision: Proceed
This is a **low-risk, high-impact** feature. Neobrutalism is trendy, playful, and fits board games well. Making it a toggle means users can choose their preference.

---

*Plan: Neobrutalism Theme for Town 77*
*Date: 2026-06-11*
*Ready for implementation*
