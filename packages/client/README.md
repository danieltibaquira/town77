# Town 77 Client

React/TypeScript client for Town 77 multiplayer strategy game.

## Design System

The client uses a comprehensive design system to support theming, consistent component APIs, and accessible interactions.

### Documentation

- **[Design System Spec](../../docs/design-system/spec-theme-and-voice.md)** — Complete reference for tokens, animation presets, component variants, and accessibility
- **[Creating a New Theme](../../docs/design-system/spec-theme-and-voice.md#9-creating-a-new-theme--step-by-step)** — Step-by-step guide for authoring themes
- **[Design Review Checklist](../../docs/design-system/spec-theme-and-voice.md#11-design-review-checklist--accessibility)** — QA checklist for themes and components
- **[Town 77 Case Study](../../docs/design-system/spec-theme-and-voice.md#10-case-study-town-77-theme)** — Reference implementation walkthrough

### Quick Links

- **Themes**: `src/themes/` — Theme definitions (town77, playful-pastel, _template)
- **Components**: `src/components/` — React components (Chip, Cell, Grid, Hand, ActionBar, PlayerBadge)
- **Tokens**: `src/styles/tokens.css` — CSS custom properties for design tokens
- **i18n**: `src/locales/` — Localization strings (English, Spanish)

### Build & Test

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm tsc --noEmit
```

## Project Structure

```
packages/client/
├── src/
│   ├── components/        — React components
│   ├── lib/              — Utilities (theme injection, i18n)
│   ├── locales/          — i18n strings (en, es)
│   ├── styles/           — CSS (tokens.css, global styles)
│   ├── themes/           — Theme definitions
│   ├── __tests__/        — Test files
│   ├── App.tsx           — Root component
│   └── main.tsx          — Vite entry point
├── public/               — Static assets
└── vite.config.ts        — Vite configuration
```

## Theming

Themes define:
- **Shapes**: 7 SVG silhouettes (cottage, tower, barn, etc.)
- **Colors**: 7-color palette for chips
- **Surfaces**: 6 background/container colors
- **Fonts**: Display and UI font stacks
- **Animation**: Motion presets (spring stiffness/damping/mass)

### Applying a Theme

In `App.tsx`:

```typescript
import { town77Theme } from './themes/town77'

// Inject theme into CSS custom properties
injectTokens(town77Theme)

// Use theme in components
<Grid validCells={validCells} />
```

### Creating a Custom Theme

1. Copy the template: `cp src/themes/_template.ts src/themes/my-theme.ts`
2. Follow [Creating a New Theme](../../docs/design-system/spec-theme-and-voice.md#9-creating-a-new-theme--step-by-step)
3. Validate colors: [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
4. Test accessibility: [Coblis Color Blindness Simulator](https://www.color-blindness.com/coblis/)

## Accessibility

All components follow [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/) guidelines:

- ✅ Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- ✅ Screen reader announcements
- ✅ Color contrast ≥ 4.5:1 (WCAG AA)
- ✅ Focus indicators visible
- ✅ `prefers-reduced-motion` respected
- ✅ Responsive text sizing (11px–56px range)

## Testing

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test -- src/__tests__/Chip.test.tsx

# Update snapshots
pnpm test -- --update
```

Test files document:
- Component prop combinations
- Token validation
- Theme structure
- Animation preset parameters
- Accessibility compliance

---

For more information, see the [full design system spec](../../docs/design-system/spec-theme-and-voice.md).
