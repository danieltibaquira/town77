# Town 77 — Phase 3: Client Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React 18 client package with design tokens, theme system, i18n (Spanish + English), Zustand store, typed socket client, and all reusable game components (Chip, Cell, Grid, Hand, PlayerBadge, ActionBar) — fully TDD with Vitest + React Testing Library.

**Architecture:** Vite 5 SPA. ThemeContext injects CSS custom properties from a static theme object at runtime. react-i18next with bundled locale JSON (no HTTP backend — simpler, fully testable). Zustand store owns socket.io-client connection and all game state. Components are pure presentational (props in, callbacks out). Screens are route stubs in Phase 3 — full implementation in Phase 4.

**Tech Stack:** React 18, Vite 5, TypeScript 5, Zustand 5, react-i18next 14, i18next 23, Framer Motion 11, React Router v6, socket.io-client 4, Vitest 2, @testing-library/react 16, @testing-library/user-event 14, jsdom, @testing-library/jest-dom 6

---

## File Map

```
town77/
├── vitest.workspace.ts              # updated: add packages/client
├── nginx/
│   └── nginx.conf                   # reverse proxy + SPA catch-all
└── packages/client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── vitest.config.ts
    ├── index.html
    ├── Dockerfile
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── router.tsx
        ├── styles/
        │   ├── reset.css
        │   └── tokens.css
        ├── lib/
        │   ├── i18n.ts
        │   ├── socket.ts
        │   └── theme.ts
        ├── locales/
        │   ├── es/common.json  game.json  config.json  results.json  errors.json
        │   └── en/common.json  game.json  config.json  results.json  errors.json
        ├── themes/
        │   └── town77.ts
        ├── store/
        │   └── gameStore.ts
        ├── components/
        │   ├── Chip.tsx
        │   ├── Cell.tsx
        │   ├── Grid.tsx
        │   ├── Hand.tsx
        │   ├── PlayerBadge.tsx
        │   └── ActionBar.tsx
        ├── screens/
        │   ├── HomeScreen.tsx   (stub)
        │   ├── ConfigScreen.tsx (stub)
        │   ├── LobbyScreen.tsx  (stub)
        │   ├── GameScreen.tsx   (stub)
        │   └── ResultsScreen.tsx (stub)
        └── __tests__/
            ├── setup.ts
            ├── helpers.tsx
            ├── i18n.test.ts
            ├── theme.test.ts
            ├── store.test.ts
            ├── Chip.test.tsx
            ├── Cell.test.tsx
            ├── Grid.test.tsx
            ├── Hand.test.tsx
            └── ActionBar.test.tsx
```

---

## Task 1: Client package scaffold

**Files:**
- Create: `packages/client/package.json`
- Create: `packages/client/tsconfig.json`
- Create: `packages/client/vite.config.ts`
- Create: `packages/client/vitest.config.ts`
- Create: `packages/client/index.html`
- Create: `packages/client/src/__tests__/setup.ts`
- Modify: `vitest.workspace.ts`

- [ ] **Step 1.1: Create `packages/client/package.json`**

```json
{
  "name": "@town77/client",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@town77/game-engine": "workspace:*",
    "@town77/shared-types": "workspace:*",
    "framer-motion": "^11.18.0",
    "i18next": "^23.16.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-i18next": "^14.1.0",
    "react-router-dom": "^6.29.0",
    "socket.io-client": "^4.8.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.4.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vite-tsconfig-paths": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 1.2: Create `packages/client/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "outDir": "./dist",
    "resolveJsonModule": true,
    "paths": {
      "@town77/shared-types": ["../shared-types/src/index.ts"],
      "@town77/game-engine": ["../game-engine/src/index.ts"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 1.3: Create `packages/client/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
```

- [ ] **Step 1.4: Create `packages/client/vitest.config.ts`**

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
      testTimeout: 10000,
    },
  }),
)
```

- [ ] **Step 1.5: Create `packages/client/index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Town 77</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 1.6: Create `packages/client/src/__tests__/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 1.7: Update `vitest.workspace.ts`** at monorepo root

```typescript
import { defineWorkspace } from 'vitest/config'
export default defineWorkspace(['packages/game-engine', 'packages/client'])
```

Note: `packages/server` uses Node environment and runs independently — excluded from workspace.

- [ ] **Step 1.8: Install deps from monorepo root**

```bash
pnpm install
```

Expected: `packages/client/node_modules/react`, `packages/client/node_modules/vite`, etc. No errors.

- [ ] **Step 1.9: Verify vitest runs (0 tests is fine)**

```bash
cd packages/client && pnpm test 2>&1
```

Expected: exits 0. Either 0 test files, or "No test files found".

- [ ] **Step 1.10: Commit**

```bash
git add packages/client/package.json packages/client/tsconfig.json packages/client/vite.config.ts packages/client/vitest.config.ts packages/client/index.html packages/client/src/__tests__/setup.ts vitest.workspace.ts
git commit -m "feat(client): scaffold del paquete cliente React"
```

---

## Task 2: CSS tokens + i18n locale files + i18n setup (TDD)

**Files:**
- Create: `packages/client/src/styles/reset.css`
- Create: `packages/client/src/styles/tokens.css`
- Create: `packages/client/src/locales/es/{common,game,config,results,errors}.json`
- Create: `packages/client/src/locales/en/{common,game,config,results,errors}.json`
- Create: `packages/client/src/lib/i18n.ts`
- Create: `packages/client/src/__tests__/i18n.test.ts`

- [ ] **Step 2.1: Write the failing test**

Create `packages/client/src/__tests__/i18n.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import i18n from '../lib/i18n'

describe('i18n', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('es')
  })

  it('resolves common:create_room in Spanish', () => {
    expect(i18n.t('common:create_room')).toBe('Crear sala')
  })

  it('resolves game:your_turn', () => {
    expect(i18n.t('game:your_turn')).toBe('Tu turno')
  })

  it('resolves errors:not_your_turn', () => {
    expect(i18n.t('errors:not_your_turn')).toBe('No es tu turno')
  })

  it('resolves config:grid_size', () => {
    expect(i18n.t('config:grid_size')).toBe('Tamaño del tablero')
  })

  it('resolves results:winner', () => {
    expect(i18n.t('results:winner')).toBe('Ganador')
  })

  it('switches to English and back', async () => {
    await i18n.changeLanguage('en')
    expect(i18n.t('common:create_room')).toBe('Create room')
    await i18n.changeLanguage('es')
  })
})
```

- [ ] **Step 2.2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- src/__tests__/i18n.test.ts 2>&1
```

Expected: FAIL `Cannot find module '../lib/i18n'`

- [ ] **Step 2.3: Create Spanish locale files**

Create `packages/client/src/locales/es/common.json`:
```json
{
  "create_room": "Crear sala",
  "join": "Unirse",
  "copy_code": "Copiar código",
  "room_full": "Sala llena",
  "room_not_found": "Sala no encontrada",
  "connecting": "Conectando…",
  "connected": "Conectado",
  "disconnected": "Desconectado",
  "back": "Volver",
  "share": "Compartir"
}
```

Create `packages/client/src/locales/es/game.json`:
```json
{
  "your_turn": "Tu turno",
  "waiting": "Esperando…",
  "exchange": "Intercambiar",
  "discard": "Descartar",
  "place": "Colocar ficha",
  "bag_empty": "Bolsa vacía",
  "bag_count": "{{count}} fichas en bolsa",
  "start_game": "Iniciar juego",
  "waiting_for_host": "Esperando al anfitrión",
  "player_joined": "{{name}} se unió",
  "player_left": "{{name}} se fue"
}
```

Create `packages/client/src/locales/es/config.json`:
```json
{
  "grid_size": "Tamaño del tablero",
  "colors": "Colores",
  "shapes": "Formas",
  "copies": "Copias",
  "hand_size": "Tamaño de mano",
  "total_chips": "Total fichas: {{count}}",
  "board_cells": "Celdas del tablero: {{count}}",
  "warning_chips_lt_cells": "Atención: hay menos fichas que celdas",
  "preset_classic": "Clásico 7×7",
  "preset_fast": "Rápido 5×5",
  "preset_custom": "Personalizado"
}
```

Create `packages/client/src/locales/es/results.json`:
```json
{
  "winner": "Ganador",
  "placed": "Fichas colocadas",
  "remaining": "Fichas restantes",
  "total": "Puntaje total",
  "play_again": "Jugar de nuevo",
  "new_room": "Nueva sala",
  "tied": "Empate"
}
```

Create `packages/client/src/locales/es/errors.json`:
```json
{
  "invalid_placement": "Colocación inválida",
  "not_your_turn": "No es tu turno",
  "exchange_rule_violated": "Regla de intercambio violada",
  "already_discarded": "Ya descartaste en esta partida",
  "room_not_found": "Sala no encontrada",
  "game_in_progress": "La partida ya inició",
  "not_enough_players": "Se necesitan al menos 2 jugadores",
  "not_host": "Solo el anfitrión puede iniciar",
  "room_full": "Sala llena"
}
```

Create `packages/client/src/locales/en/common.json`:
```json
{
  "create_room": "Create room",
  "join": "Join",
  "copy_code": "Copy code",
  "room_full": "Room full",
  "room_not_found": "Room not found",
  "connecting": "Connecting…",
  "connected": "Connected",
  "disconnected": "Disconnected",
  "back": "Back",
  "share": "Share"
}
```

Create `packages/client/src/locales/en/game.json`:
```json
{
  "your_turn": "Your turn",
  "waiting": "Waiting…",
  "exchange": "Exchange",
  "discard": "Discard",
  "place": "Place chip",
  "bag_empty": "Bag empty",
  "bag_count": "{{count}} chips in bag",
  "start_game": "Start game",
  "waiting_for_host": "Waiting for host",
  "player_joined": "{{name}} joined",
  "player_left": "{{name}} left"
}
```

Create `packages/client/src/locales/en/config.json`:
```json
{
  "grid_size": "Board size",
  "colors": "Colors",
  "shapes": "Shapes",
  "copies": "Copies",
  "hand_size": "Hand size",
  "total_chips": "Total chips: {{count}}",
  "board_cells": "Board cells: {{count}}",
  "warning_chips_lt_cells": "Warning: fewer chips than cells",
  "preset_classic": "Classic 7×7",
  "preset_fast": "Fast 5×5",
  "preset_custom": "Custom"
}
```

Create `packages/client/src/locales/en/results.json`:
```json
{
  "winner": "Winner",
  "placed": "Chips placed",
  "remaining": "Chips remaining",
  "total": "Total score",
  "play_again": "Play again",
  "new_room": "New room",
  "tied": "Tied"
}
```

Create `packages/client/src/locales/en/errors.json`:
```json
{
  "invalid_placement": "Invalid placement",
  "not_your_turn": "Not your turn",
  "exchange_rule_violated": "Exchange rule violated",
  "already_discarded": "Already discarded this game",
  "room_not_found": "Room not found",
  "game_in_progress": "Game already in progress",
  "not_enough_players": "Need at least 2 players",
  "not_host": "Only the host can start",
  "room_full": "Room full"
}
```

- [ ] **Step 2.4: Create `packages/client/src/lib/i18n.ts`**

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import esCommon from '../locales/es/common.json'
import esGame from '../locales/es/game.json'
import esConfig from '../locales/es/config.json'
import esResults from '../locales/es/results.json'
import esErrors from '../locales/es/errors.json'

import enCommon from '../locales/en/common.json'
import enGame from '../locales/en/game.json'
import enConfig from '../locales/en/config.json'
import enResults from '../locales/en/results.json'
import enErrors from '../locales/en/errors.json'

void i18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['common', 'game', 'config', 'results', 'errors'],
  defaultNS: 'common',
  resources: {
    es: { common: esCommon, game: esGame, config: esConfig, results: esResults, errors: esErrors },
    en: { common: enCommon, game: enGame, config: enConfig, results: enResults, errors: enErrors },
  },
  interpolation: { escapeValue: false },
})

export default i18n
```

- [ ] **Step 2.5: Create CSS files**

Create `packages/client/src/styles/reset.css`:
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-text-size-adjust: 100%; }
body { min-height: 100vh; line-height: 1.5; -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
button { cursor: pointer; border: none; background: none; font: inherit; }
a { color: inherit; text-decoration: none; }
ul, ol { list-style: none; }
```

Create `packages/client/src/styles/tokens.css`:
```css
:root {
  --duration-instant: 80ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;
  --duration-epic: 1200ms;

  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out: cubic-bezier(0.0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.27, 1.55);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-pill: 9999px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 40px;
  --space-2xl: 64px;

  --text-sm:      clamp(11px, 2vw, 13px);
  --text-base:    clamp(14px, 3vw, 16px);
  --text-lg:      clamp(18px, 4vw, 24px);
  --text-display: clamp(28px, 6vw, 56px);

  --layout-cell:   clamp(40px, 8vw, 72px);
  --layout-gap:    clamp(2px, 0.5vw, 6px);
  --layout-hand-h: clamp(96px, 15vh, 140px);

  /* Semantic defaults — overridden at runtime by injectTokens */
  --color-surface-bg:           #0F0D17;
  --color-surface-grid:         #1C1828;
  --color-surface-cell:         #241F35;
  --color-surface-cell-hover:   #2E2847;
  --color-surface-cell-valid:   #2C4A2E;
  --color-surface-cell-invalid: #4A2020;
  --color-text-primary:         #F0EAD6;
  --color-text-secondary:       #9B92A8;
  --color-text-accent:          #C4A35A;

  --chip-color-1: #B04A2F;
  --chip-color-2: #3D7AB5;
  --chip-color-3: #4A7C59;
  --chip-color-4: #C4A35A;
  --chip-color-5: #8B3A52;
  --chip-color-6: #2B2F5E;
  --chip-color-7: #E8D5B0;
}
```

- [ ] **Step 2.6: Run — expect PASS (GREEN)**

```bash
cd packages/client && pnpm test -- src/__tests__/i18n.test.ts 2>&1
```

Expected: 6 tests passing.

**Paste test runner output verbatim.**

- [ ] **Step 2.7: Commit**

```bash
git add packages/client/src/styles packages/client/src/locales packages/client/src/lib/i18n.ts packages/client/src/__tests__/i18n.test.ts
git commit -m "feat(client): tokens CSS, localización española e inglesa, setup i18n"
```

---

## Task 3: Theme system (TDD)

**Files:**
- Create: `packages/client/src/themes/town77.ts`
- Create: `packages/client/src/lib/theme.ts`
- Create: `packages/client/src/__tests__/theme.test.ts`

- [ ] **Step 3.1: Write the failing test**

Create `packages/client/src/__tests__/theme.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { injectTokens } from '../lib/theme'
import { town77Theme } from '../themes/town77'

describe('injectTokens', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style')
  })

  it('sets --color-surface-bg from theme', () => {
    injectTokens(town77Theme)
    expect(document.documentElement.style.getPropertyValue('--color-surface-bg')).toBe('#0F0D17')
  })

  it('sets --color-surface-grid from theme', () => {
    injectTokens(town77Theme)
    expect(document.documentElement.style.getPropertyValue('--color-surface-grid')).toBe('#1C1828')
  })

  it('sets chip color CSS vars for palette entries', () => {
    injectTokens(town77Theme)
    expect(document.documentElement.style.getPropertyValue('--chip-color-1')).toBe('#B04A2F')
    expect(document.documentElement.style.getPropertyValue('--chip-color-7')).toBe('#E8D5B0')
  })

  it('sets --font-display from theme', () => {
    injectTokens(town77Theme)
    expect(document.documentElement.style.getPropertyValue('--font-display')).toBe("'Bebas Neue', sans-serif")
  })
})
```

- [ ] **Step 3.2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- src/__tests__/theme.test.ts 2>&1
```

Expected: FAIL `Cannot find module '../lib/theme'`

- [ ] **Step 3.3: Create `packages/client/src/themes/town77.ts`**

```typescript
import type { Theme } from '@town77/shared-types'

export const town77Theme: Theme = {
  id: 'town77',
  name: 'Town 77',
  shapes: {
    cottage:    'M5 35 L5 20 L20 5 L35 20 L35 35 Z',
    rowhouse:   'M8 35 L8 16 L20 5 L32 16 L32 35 Z',
    tower:      'M13 35 L13 3 L16 1 L24 1 L27 3 L27 35 Z',
    victorian:  'M5 35 L5 22 L12 12 L20 3 L28 12 L35 22 L35 35 Z',
    barn:       'M4 35 L4 20 Q20 8 36 20 L36 35 Z',
    bungalow:   'M3 35 L3 24 L10 17 L30 17 L37 24 L37 35 Z',
    skyscraper: 'M13 35 L13 2 L20 0 L27 2 L27 35 Z',
  },
  colorPalette: {
    'color-1': '#B04A2F',
    'color-2': '#3D7AB5',
    'color-3': '#4A7C59',
    'color-4': '#C4A35A',
    'color-5': '#8B3A52',
    'color-6': '#2B2F5E',
    'color-7': '#E8D5B0',
  },
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
  },
  animationPreset: {
    chipPlace:   { type: 'spring', stiffness: 260, damping: 20, mass: 1 },
    chipInvalid: { x: [-6, 6, -4, 4, 0], duration: 0.3 },
    chipDraw:    { duration: 0.25, ease: 'easeOut' },
    cellPulse:   { duration: 0.6, repeat: 1 },
    turnIn:      { duration: 0.4, ease: 'easeOut' },
    celebrate:   { duration: 1.2, particleCount: 60, spread: 100 },
  },
}
```

- [ ] **Step 3.4: Create `packages/client/src/lib/theme.ts`**

```typescript
import { createContext, useContext } from 'react'
import type { Theme } from '@town77/shared-types'
import { town77Theme } from '../themes/town77'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: town77Theme,
  setTheme: () => {},
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

export function injectTokens(theme: Theme): void {
  const s = document.documentElement.style
  s.setProperty('--color-surface-bg',          theme.surfaces.background)
  s.setProperty('--color-surface-grid',         theme.surfaces.grid)
  s.setProperty('--color-surface-cell',         theme.surfaces.cell)
  s.setProperty('--color-surface-cell-hover',   theme.surfaces.cellHover)
  s.setProperty('--color-surface-cell-valid',   theme.surfaces.cellValid)
  s.setProperty('--color-surface-cell-invalid', theme.surfaces.cellInvalid)
  s.setProperty('--font-display',               theme.fonts.display)
  s.setProperty('--font-ui',                    theme.fonts.ui)
  for (const [colorId, hex] of Object.entries(theme.colorPalette)) {
    const idx = colorId.replace('color-', '')
    s.setProperty(`--chip-color-${idx}`, hex)
  }
}
```

- [ ] **Step 3.5: Run — expect PASS (GREEN)**

```bash
cd packages/client && pnpm test -- src/__tests__/theme.test.ts 2>&1
```

Expected: 4 tests passing.

**Paste test runner output verbatim.**

- [ ] **Step 3.6: Commit**

```bash
git add packages/client/src/themes packages/client/src/lib/theme.ts packages/client/src/__tests__/theme.test.ts
git commit -m "feat(client): sistema de temas — ThemeContext e inyección de tokens CSS"
```

---

## Task 4: Socket client + Zustand store (TDD)

**Files:**
- Create: `packages/client/src/lib/socket.ts`
- Create: `packages/client/src/store/gameStore.ts`
- Create: `packages/client/src/__tests__/store.test.ts`

- [ ] **Step 4.1: Write the failing test**

Create `packages/client/src/__tests__/store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import type { GameState } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createGrid } from '@town77/game-engine'
import { useGameStore } from '../store/gameStore'

function makeGameState(phase: GameState['phase'] = 'lobby'): GameState {
  return {
    grid: createGrid(7, 7),
    bag: [],
    players: [
      { id: 'p1', name: 'Alice', hand: [], placed: 0, hasDiscarded: false, connected: true },
    ],
    turnIndex: 0,
    phase,
    config: DEFAULT_GAME_CONFIG,
    themeId: 'town77',
    seed: 42,
  }
}

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      gameState: null,
      playerId: null,
      sessionToken: null,
      roomCode: null,
      selectedChip: null,
      lastError: null,
      connected: false,
    })
  })

  it('has correct initial state', () => {
    const { gameState, playerId, roomCode, connected } = useGameStore.getState()
    expect(gameState).toBeNull()
    expect(playerId).toBeNull()
    expect(roomCode).toBeNull()
    expect(connected).toBe(false)
  })

  it('setGameState updates gameState', () => {
    const state = makeGameState()
    useGameStore.getState().setGameState(state)
    expect(useGameStore.getState().gameState).toEqual(state)
  })

  it('setSession sets playerId, sessionToken, roomCode', () => {
    useGameStore.getState().setSession({ playerId: 'p1', sessionToken: 'tok', roomCode: 'ABC123' })
    const { playerId, sessionToken, roomCode } = useGameStore.getState()
    expect(playerId).toBe('p1')
    expect(sessionToken).toBe('tok')
    expect(roomCode).toBe('ABC123')
  })

  it('selectChip sets selectedChip', () => {
    const chip = { color: 'color-1', shape: 'cottage' }
    useGameStore.getState().selectChip(chip)
    expect(useGameStore.getState().selectedChip).toEqual(chip)
  })

  it('selectChip with null deselects', () => {
    useGameStore.getState().selectChip({ color: 'color-1', shape: 'cottage' })
    useGameStore.getState().selectChip(null)
    expect(useGameStore.getState().selectedChip).toBeNull()
  })

  it('setError sets lastError', () => {
    useGameStore.getState().setError({ code: 'INVALID_PLACEMENT', messageKey: 'errors.invalid_placement' })
    expect(useGameStore.getState().lastError?.code).toBe('INVALID_PLACEMENT')
  })

  it('clearError clears lastError', () => {
    useGameStore.getState().setError({ code: 'X', messageKey: 'x' })
    useGameStore.getState().clearError()
    expect(useGameStore.getState().lastError).toBeNull()
  })
})
```

- [ ] **Step 4.2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- src/__tests__/store.test.ts 2>&1
```

Expected: FAIL `Cannot find module '../store/gameStore'`

- [ ] **Step 4.3: Create `packages/client/src/lib/socket.ts`**

```typescript
import { io } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@town77/shared-types'

const SERVER_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL
  ? import.meta.env.VITE_SERVER_URL as string
  : ''

export const socket = io<ServerToClientEvents, ClientToServerEvents>(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: false,
})
```

- [ ] **Step 4.4: Create `packages/client/src/store/gameStore.ts`**

```typescript
import { create } from 'zustand'
import type { Chip, GameState, ErrorPayload } from '@town77/shared-types'
import { socket } from '../lib/socket'

interface GameStore {
  gameState: GameState | null
  playerId: string | null
  sessionToken: string | null
  roomCode: string | null
  selectedChip: Chip | null
  lastError: ErrorPayload | null
  connected: boolean

  setGameState: (state: GameState) => void
  setSession: (s: { playerId: string; sessionToken: string; roomCode: string }) => void
  selectChip: (chip: Chip | null) => void
  setError: (error: ErrorPayload) => void
  clearError: () => void
  setConnected: (connected: boolean) => void

  connect: () => void
  disconnect: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  playerId: null,
  sessionToken: null,
  roomCode: null,
  selectedChip: null,
  lastError: null,
  connected: false,

  setGameState: (gameState) => set({ gameState }),
  setSession: ({ playerId, sessionToken, roomCode }) => set({ playerId, sessionToken, roomCode }),
  selectChip: (selectedChip) => set({ selectedChip }),
  setError: (lastError) => set({ lastError }),
  clearError: () => set({ lastError: null }),
  setConnected: (connected) => set({ connected }),

  connect: () => {
    socket.on('connect', () => set({ connected: true }))
    socket.on('disconnect', () => set({ connected: false }))
    socket.on('room_joined', (payload) => {
      set({ roomCode: payload.code, playerId: payload.playerId, sessionToken: payload.sessionToken, gameState: payload.state })
      localStorage.setItem('sessionToken', payload.sessionToken)
      localStorage.setItem('playerId', payload.playerId)
    })
    socket.on('state_update', ({ state }) => set({ gameState: state }))
    socket.on('error', (err) => set({ lastError: err }))
    socket.connect()
  },

  disconnect: () => {
    socket.disconnect()
    socket.removeAllListeners()
  },
}))
```

- [ ] **Step 4.5: Run — expect PASS (GREEN)**

```bash
cd packages/client && pnpm test -- src/__tests__/store.test.ts 2>&1
```

Expected: 7 tests passing.

**Paste test runner output verbatim.**

- [ ] **Step 4.6: Commit**

```bash
git add packages/client/src/lib/socket.ts packages/client/src/store/gameStore.ts packages/client/src/__tests__/store.test.ts
git commit -m "feat(client): store Zustand y cliente socket tipado"
```

---

## Task 5: Chip + Cell components (TDD)

**Files:**
- Create: `packages/client/src/__tests__/helpers.tsx`
- Create: `packages/client/src/components/Chip.tsx`
- Create: `packages/client/src/components/Cell.tsx`
- Create: `packages/client/src/__tests__/Chip.test.tsx`
- Create: `packages/client/src/__tests__/Cell.test.tsx`

- [ ] **Step 5.1: Create test render helper**

Create `packages/client/src/__tests__/helpers.tsx`:
```tsx
import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ThemeContext } from '../lib/theme'
import { town77Theme } from '../themes/town77'

export function renderWithTheme(ui: ReactElement, options?: RenderOptions) {
  return render(
    <ThemeContext.Provider value={{ theme: town77Theme, setTheme: () => {} }}>
      {ui}
    </ThemeContext.Provider>,
    options,
  )
}
```

- [ ] **Step 5.2: Write the failing tests**

Create `packages/client/src/__tests__/Chip.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { Chip } from '../components/Chip'
import { renderWithTheme } from './helpers'

describe('Chip', () => {
  const chip = { color: 'color-1', shape: 'cottage' }

  it('renders with data-testid', () => {
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />)
    expect(screen.getByTestId('chip-color-1-cottage')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />)
    expect(screen.getByTestId('chip-color-1-cottage').querySelector('svg')).not.toBeNull()
  })

  it('sets data-selected=true when isSelected', () => {
    renderWithTheme(<Chip chip={chip} isSelected={true} isValid={true} />)
    expect(screen.getByTestId('chip-color-1-cottage')).toHaveAttribute('data-selected', 'true')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} onClick={onClick} />)
    fireEvent.click(screen.getByTestId('chip-color-1-cottage'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders without throwing for unknown color', () => {
    expect(() =>
      renderWithTheme(<Chip chip={{ color: 'color-99', shape: 'cottage' }} isSelected={false} isValid={true} />),
    ).not.toThrow()
  })
})
```

Create `packages/client/src/__tests__/Cell.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { Cell } from '../components/Cell'
import { renderWithTheme } from './helpers'

describe('Cell', () => {
  it('renders with data-testid', () => {
    renderWithTheme(<Cell row={0} col={0} chip={null} isValid={false} />)
    expect(screen.getByTestId('cell-0-0')).toBeInTheDocument()
  })

  it('renders chip when occupied', () => {
    renderWithTheme(<Cell row={3} col={4} chip={{ color: 'color-2', shape: 'tower' }} isValid={false} />)
    expect(screen.getByTestId('chip-color-2-tower')).toBeInTheDocument()
  })

  it('sets data-valid=true when isValid', () => {
    renderWithTheme(<Cell row={1} col={1} chip={null} isValid={true} />)
    expect(screen.getByTestId('cell-1-1')).toHaveAttribute('data-valid', 'true')
  })

  it('calls onClick with row and col on empty valid cell', () => {
    const onClick = vi.fn()
    renderWithTheme(<Cell row={2} col={3} chip={null} isValid={true} onClick={onClick} />)
    fireEvent.click(screen.getByTestId('cell-2-3'))
    expect(onClick).toHaveBeenCalledWith(2, 3)
  })

  it('does not call onClick on occupied cell', () => {
    const onClick = vi.fn()
    renderWithTheme(<Cell row={0} col={0} chip={{ color: 'color-1', shape: 'barn' }} isValid={false} onClick={onClick} />)
    fireEvent.click(screen.getByTestId('cell-0-0'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 5.3: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- src/__tests__/Chip.test.tsx src/__tests__/Cell.test.tsx 2>&1
```

Expected: FAIL `Cannot find module '../components/Chip'`

- [ ] **Step 5.4: Create `packages/client/src/components/Chip.tsx`**

```tsx
import type { Chip as ChipType } from '@town77/shared-types'
import { useTheme } from '../lib/theme'

interface ChipProps {
  chip: ChipType
  isSelected: boolean
  isValid: boolean
  onClick?: () => void
}

export function Chip({ chip, isSelected, isValid, onClick }: ChipProps) {
  const { theme } = useTheme()
  const svgPath = theme.shapes[chip.shape] ?? 'M5 35 L20 5 L35 35 Z'
  const fill = theme.colorPalette[chip.color] ?? '#888888'

  return (
    <button
      data-testid={`chip-${chip.color}-${chip.shape}`}
      data-selected={isSelected}
      data-valid={isValid}
      onClick={onClick}
      style={{ background: 'none', border: 'none', padding: 0, cursor: onClick ? 'pointer' : 'default', display: 'block', width: '100%', height: '100%' }}
    >
      <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden>
        <path d={svgPath} fill={fill} />
      </svg>
    </button>
  )
}
```

- [ ] **Step 5.5: Create `packages/client/src/components/Cell.tsx`**

```tsx
import type { Chip as ChipType } from '@town77/shared-types'
import { useTheme } from '../lib/theme'
import { Chip } from './Chip'

interface CellProps {
  row: number
  col: number
  chip: ChipType | null
  isValid: boolean
  onClick?: (row: number, col: number) => void
}

export function Cell({ row, col, chip, isValid, onClick }: CellProps) {
  const { theme } = useTheme()

  function handleClick() {
    if (chip !== null || !onClick) return
    onClick(row, col)
  }

  const bg = chip !== null
    ? theme.surfaces.cell
    : isValid
      ? theme.surfaces.cellValid
      : theme.surfaces.cell

  return (
    <div
      data-testid={`cell-${row}-${col}`}
      data-valid={isValid}
      onClick={handleClick}
      style={{
        width: 'var(--layout-cell)',
        height: 'var(--layout-cell)',
        background: bg,
        borderRadius: 'var(--radius-sm)',
        cursor: isValid && chip === null && onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {chip !== null && <Chip chip={chip} isSelected={false} isValid={false} />}
    </div>
  )
}
```

- [ ] **Step 5.6: Run — expect PASS (GREEN)**

```bash
cd packages/client && pnpm test -- src/__tests__/Chip.test.tsx src/__tests__/Cell.test.tsx 2>&1
```

Expected: 10 tests passing (5 Chip + 5 Cell).

**Paste test runner output verbatim.**

- [ ] **Step 5.7: Commit**

```bash
git add packages/client/src/components/Chip.tsx packages/client/src/components/Cell.tsx packages/client/src/__tests__/Chip.test.tsx packages/client/src/__tests__/Cell.test.tsx packages/client/src/__tests__/helpers.tsx
git commit -m "feat(client): componentes Chip y Cell con TDD"
```

---

## Task 6: Grid component (TDD)

**Files:**
- Create: `packages/client/src/components/Grid.tsx`
- Create: `packages/client/src/__tests__/Grid.test.tsx`

- [ ] **Step 6.1: Write the failing test**

Create `packages/client/src/__tests__/Grid.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Grid as GridType } from '@town77/shared-types'
import { createGrid } from '@town77/game-engine'
import { Grid } from '../components/Grid'
import { renderWithTheme } from './helpers'

describe('Grid', () => {
  const emptyGrid: GridType = createGrid(7, 7)

  it('renders 49 cells for a 7×7 grid', () => {
    renderWithTheme(<Grid grid={emptyGrid} validCells={[]} onCellClick={() => {}} />)
    expect(screen.getAllByTestId(/^cell-\d+-\d+$/)).toHaveLength(49)
  })

  it('renders corner cells cell-0-0 and cell-6-6', () => {
    renderWithTheme(<Grid grid={emptyGrid} validCells={[]} onCellClick={() => {}} />)
    expect(screen.getByTestId('cell-0-0')).toBeInTheDocument()
    expect(screen.getByTestId('cell-6-6')).toBeInTheDocument()
  })

  it('marks valid cells with data-valid=true', () => {
    renderWithTheme(
      <Grid grid={emptyGrid} validCells={[[0, 0], [3, 4]]} onCellClick={() => {}} />,
    )
    expect(screen.getByTestId('cell-0-0')).toHaveAttribute('data-valid', 'true')
    expect(screen.getByTestId('cell-3-4')).toHaveAttribute('data-valid', 'true')
    expect(screen.getByTestId('cell-1-1')).toHaveAttribute('data-valid', 'false')
  })

  it('renders chip in occupied cell', () => {
    const grid = emptyGrid.map((row) => [...row]) as GridType
    grid[2]![3] = { color: 'color-1', shape: 'cottage' }
    renderWithTheme(<Grid grid={grid} validCells={[]} onCellClick={() => {}} />)
    expect(screen.getByTestId('chip-color-1-cottage')).toBeInTheDocument()
  })

  it('calls onCellClick when valid empty cell clicked', () => {
    const onCellClick = vi.fn()
    renderWithTheme(
      <Grid grid={emptyGrid} validCells={[[2, 3]]} onCellClick={onCellClick} />,
    )
    fireEvent.click(screen.getByTestId('cell-2-3'))
    expect(onCellClick).toHaveBeenCalledWith(2, 3)
  })
})
```

- [ ] **Step 6.2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- src/__tests__/Grid.test.tsx 2>&1
```

Expected: FAIL `Cannot find module '../components/Grid'`

- [ ] **Step 6.3: Create `packages/client/src/components/Grid.tsx`**

```tsx
import type { Grid as GridType } from '@town77/shared-types'
import { useTheme } from '../lib/theme'
import { Cell } from './Cell'

interface GridProps {
  grid: GridType
  validCells: [number, number][]
  onCellClick?: (row: number, col: number) => void
}

export function Grid({ grid, validCells, onCellClick }: GridProps) {
  const { theme } = useTheme()
  const validSet = new Set(validCells.map(([r, c]) => `${r},${c}`))
  const cols = grid[0]?.length ?? 7

  return (
    <div
      data-testid="grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, var(--layout-cell))`,
        gap: 'var(--layout-gap)',
        background: theme.surfaces.grid,
        padding: 'var(--space-sm)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {grid.map((row, r) =>
        row.map((chip, c) => (
          <Cell
            key={`${r}-${c}`}
            row={r}
            col={c}
            chip={chip}
            isValid={validSet.has(`${r},${c}`)}
            onClick={onCellClick}
          />
        )),
      )}
    </div>
  )
}
```

- [ ] **Step 6.4: Run — expect PASS (GREEN)**

```bash
cd packages/client && pnpm test -- src/__tests__/Grid.test.tsx 2>&1
```

Expected: 5 tests passing.

**Paste test runner output verbatim.**

- [ ] **Step 6.5: Commit**

```bash
git add packages/client/src/components/Grid.tsx packages/client/src/__tests__/Grid.test.tsx
git commit -m "feat(client): componente Grid con TDD"
```

---

## Task 7: Hand + PlayerBadge + ActionBar components (TDD)

**Files:**
- Create: `packages/client/src/components/Hand.tsx`
- Create: `packages/client/src/components/PlayerBadge.tsx`
- Create: `packages/client/src/components/ActionBar.tsx`
- Create: `packages/client/src/__tests__/Hand.test.tsx`
- Create: `packages/client/src/__tests__/ActionBar.test.tsx`

- [ ] **Step 7.1: Write failing tests**

Create `packages/client/src/__tests__/Hand.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Chip } from '@town77/shared-types'
import { Hand } from '../components/Hand'
import { renderWithTheme } from './helpers'

describe('Hand', () => {
  const chips: Chip[] = [
    { color: 'color-1', shape: 'cottage' },
    { color: 'color-2', shape: 'tower' },
    { color: 'color-3', shape: 'barn' },
    { color: 'color-4', shape: 'victorian' },
  ]

  it('renders all chips in hand', () => {
    renderWithTheme(<Hand chips={chips} selectedChip={null} onSelect={() => {}} />)
    expect(screen.getByTestId('chip-color-1-cottage')).toBeInTheDocument()
    expect(screen.getByTestId('chip-color-4-victorian')).toBeInTheDocument()
  })

  it('marks selected chip with data-selected=true', () => {
    renderWithTheme(<Hand chips={chips} selectedChip={chips[0]!} onSelect={() => {}} />)
    expect(screen.getByTestId('chip-color-1-cottage')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByTestId('chip-color-2-tower')).toHaveAttribute('data-selected', 'false')
  })

  it('calls onSelect when chip is clicked', () => {
    const onSelect = vi.fn()
    renderWithTheme(<Hand chips={chips} selectedChip={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('chip-color-2-tower'))
    expect(onSelect).toHaveBeenCalledWith(chips[1])
  })

  it('renders empty hand without crashing', () => {
    expect(() =>
      renderWithTheme(<Hand chips={[]} selectedChip={null} onSelect={() => {}} />),
    ).not.toThrow()
  })
})
```

Create `packages/client/src/__tests__/ActionBar.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ActionBar } from '../components/ActionBar'
import { renderWithTheme } from './helpers'

describe('ActionBar', () => {
  it('renders exchange and discard buttons', () => {
    renderWithTheme(
      <ActionBar canExchange={true} canDiscard={true} onExchange={() => {}} onDiscard={() => {}} />,
    )
    expect(screen.getByTestId('btn-exchange')).toBeInTheDocument()
    expect(screen.getByTestId('btn-discard')).toBeInTheDocument()
  })

  it('disables exchange button when canExchange=false', () => {
    renderWithTheme(
      <ActionBar canExchange={false} canDiscard={true} onExchange={() => {}} onDiscard={() => {}} />,
    )
    expect(screen.getByTestId('btn-exchange')).toBeDisabled()
  })

  it('disables discard button when canDiscard=false', () => {
    renderWithTheme(
      <ActionBar canExchange={true} canDiscard={false} onExchange={() => {}} onDiscard={() => {}} />,
    )
    expect(screen.getByTestId('btn-discard')).toBeDisabled()
  })

  it('calls onExchange when exchange button clicked', () => {
    const onExchange = vi.fn()
    renderWithTheme(
      <ActionBar canExchange={true} canDiscard={true} onExchange={onExchange} onDiscard={() => {}} />,
    )
    fireEvent.click(screen.getByTestId('btn-exchange'))
    expect(onExchange).toHaveBeenCalledTimes(1)
  })

  it('calls onDiscard when discard button clicked', () => {
    const onDiscard = vi.fn()
    renderWithTheme(
      <ActionBar canExchange={true} canDiscard={true} onExchange={() => {}} onDiscard={onDiscard} />,
    )
    fireEvent.click(screen.getByTestId('btn-discard'))
    expect(onDiscard).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 7.2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- src/__tests__/Hand.test.tsx src/__tests__/ActionBar.test.tsx 2>&1
```

Expected: FAIL `Cannot find module '../components/Hand'`

- [ ] **Step 7.3: Create `packages/client/src/components/Hand.tsx`**

```tsx
import type { Chip } from '@town77/shared-types'
import { useTheme } from '../lib/theme'
import { Chip as ChipComponent } from './Chip'

interface HandProps {
  chips: Chip[]
  selectedChip: Chip | null
  onSelect: (chip: Chip) => void
}

export function Hand({ chips, selectedChip, onSelect }: HandProps) {
  const { theme } = useTheme()
  return (
    <div
      data-testid="hand"
      style={{
        display: 'flex',
        gap: 'var(--space-sm)',
        overflowX: 'auto',
        padding: 'var(--space-sm)',
        background: theme.surfaces.grid,
        borderRadius: 'var(--radius-md)',
        height: 'var(--layout-hand-h)',
        alignItems: 'center',
      }}
    >
      {chips.map((chip) => {
        const isSelected =
          selectedChip !== null &&
          selectedChip.color === chip.color &&
          selectedChip.shape === chip.shape
        return (
          <div
            key={`${chip.color}-${chip.shape}`}
            style={{ flexShrink: 0, width: 'var(--layout-cell)', height: 'var(--layout-cell)' }}
          >
            <ChipComponent
              chip={chip}
              isSelected={isSelected}
              isValid={true}
              onClick={() => onSelect(chip)}
            />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 7.4: Create `packages/client/src/components/PlayerBadge.tsx`**

```tsx
import type { PlayerState } from '@town77/shared-types'

interface PlayerBadgeProps {
  player: PlayerState
  isCurrentTurn: boolean
  isMyPlayer: boolean
}

export function PlayerBadge({ player, isCurrentTurn, isMyPlayer }: PlayerBadgeProps) {
  return (
    <div
      data-testid={`player-badge-${player.id}`}
      data-active={isCurrentTurn}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: 'var(--space-xs) var(--space-sm)',
        borderRadius: 'var(--radius-pill)',
        background: isCurrentTurn ? 'var(--color-text-accent)' : 'var(--color-surface-cell)',
        color: isCurrentTurn ? '#000' : 'var(--color-text-primary)',
        fontWeight: isMyPlayer ? 700 : 400,
        fontSize: 'var(--text-sm)',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: player.connected ? '#4CAF50' : '#9E9E9E',
          flexShrink: 0,
        }}
      />
      <span>{player.name}</span>
      <span style={{ opacity: 0.7 }}>{player.placed}</span>
    </div>
  )
}
```

- [ ] **Step 7.5: Create `packages/client/src/components/ActionBar.tsx`**

```tsx
interface ActionBarProps {
  canExchange: boolean
  canDiscard: boolean
  onExchange: () => void
  onDiscard: () => void
}

export function ActionBar({ canExchange, canDiscard, onExchange, onDiscard }: ActionBarProps) {
  return (
    <div data-testid="action-bar" style={{ display: 'flex', gap: 'var(--space-sm)', padding: 'var(--space-sm)' }}>
      <button
        data-testid="btn-exchange"
        disabled={!canExchange}
        onClick={onExchange}
        style={{
          padding: 'var(--space-xs) var(--space-md)',
          borderRadius: 'var(--radius-md)',
          background: canExchange ? 'var(--color-text-accent)' : 'var(--color-surface-cell)',
          color: canExchange ? '#000' : 'var(--color-text-secondary)',
          cursor: canExchange ? 'pointer' : 'not-allowed',
          fontWeight: 600,
          border: 'none',
        }}
      >
        Intercambiar
      </button>
      <button
        data-testid="btn-discard"
        disabled={!canDiscard}
        onClick={onDiscard}
        style={{
          padding: 'var(--space-xs) var(--space-md)',
          borderRadius: 'var(--radius-md)',
          background: canDiscard ? 'var(--color-surface-cell-hover)' : 'var(--color-surface-cell)',
          color: canDiscard ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          cursor: canDiscard ? 'pointer' : 'not-allowed',
          fontWeight: 600,
          border: 'none',
        }}
      >
        Descartar
      </button>
    </div>
  )
}
```

- [ ] **Step 7.6: Run — expect PASS (GREEN)**

```bash
cd packages/client && pnpm test -- src/__tests__/Hand.test.tsx src/__tests__/ActionBar.test.tsx 2>&1
```

Expected: 9 tests passing (4 Hand + 5 ActionBar).

**Paste test runner output verbatim.**

- [ ] **Step 7.7: Run full client suite**

```bash
cd packages/client && pnpm test 2>&1
```

Expected: all tests passing (i18n + theme + store + Chip + Cell + Grid + Hand + ActionBar = 36 tests).

**Paste full output verbatim.**

- [ ] **Step 7.8: Commit**

```bash
git add packages/client/src/components packages/client/src/__tests__/Hand.test.tsx packages/client/src/__tests__/ActionBar.test.tsx
git commit -m "feat(client): componentes Hand, PlayerBadge y ActionBar con TDD"
```

---

## Task 8: Router + screen stubs + App shell + build verification

**Files:**
- Create: `packages/client/src/screens/{Home,Config,Lobby,Game,Results}Screen.tsx`
- Create: `packages/client/src/router.tsx`
- Create: `packages/client/src/App.tsx`
- Create: `packages/client/src/main.tsx`

- [ ] **Step 8.1: Create screen stubs**

Create `packages/client/src/screens/HomeScreen.tsx`:
```tsx
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export function HomeScreen() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  return (
    <main data-testid="home-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-surface-bg)', gap: 'var(--space-lg)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', color: 'var(--color-text-primary)' }}>Town 77</h1>
      <button data-testid="btn-create" onClick={() => navigate('/config')} style={{ padding: 'var(--space-md) var(--space-xl)', borderRadius: 'var(--radius-lg)', background: 'var(--color-text-accent)', fontWeight: 700, fontSize: 'var(--text-lg)', border: 'none', cursor: 'pointer' }}>
        {t('create_room')}
      </button>
      <button data-testid="btn-join" onClick={() => navigate('/join')} style={{ padding: 'var(--space-sm) var(--space-xl)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-cell)', color: 'var(--color-text-primary)', fontSize: 'var(--text-base)', border: 'none', cursor: 'pointer' }}>
        {t('join')}
      </button>
    </main>
  )
}
```

Create `packages/client/src/screens/ConfigScreen.tsx`:
```tsx
export function ConfigScreen() {
  return <main data-testid="config-screen" style={{ minHeight: '100vh', background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', padding: 'var(--space-xl)' }}>Config — Phase 4</main>
}
```

Create `packages/client/src/screens/LobbyScreen.tsx`:
```tsx
export function LobbyScreen() {
  return <main data-testid="lobby-screen" style={{ minHeight: '100vh', background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', padding: 'var(--space-xl)' }}>Lobby — Phase 4</main>
}
```

Create `packages/client/src/screens/GameScreen.tsx`:
```tsx
export function GameScreen() {
  return <main data-testid="game-screen" style={{ minHeight: '100vh', background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', padding: 'var(--space-xl)' }}>Game — Phase 4</main>
}
```

Create `packages/client/src/screens/ResultsScreen.tsx`:
```tsx
export function ResultsScreen() {
  return <main data-testid="results-screen" style={{ minHeight: '100vh', background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', padding: 'var(--space-xl)' }}>Results — Phase 4</main>
}
```

- [ ] **Step 8.2: Create `packages/client/src/router.tsx`**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { ConfigScreen } from './screens/ConfigScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultsScreen } from './screens/ResultsScreen'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/config" element={<ConfigScreen />} />
      <Route path="/join" element={<LobbyScreen />} />
      <Route path="/room/:code" element={<LobbyScreen />} />
      <Route path="/game/:code" element={<GameScreen />} />
      <Route path="/results/:code" element={<ResultsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

- [ ] **Step 8.3: Create `packages/client/src/App.tsx`**

```tsx
import { Suspense, useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import type { Theme } from '@town77/shared-types'
import i18n from './lib/i18n'
import { ThemeContext, injectTokens } from './lib/theme'
import { town77Theme } from './themes/town77'
import { AppRouter } from './router'
import './styles/reset.css'
import './styles/tokens.css'

export function App() {
  const [theme, setTheme] = useState<Theme>(town77Theme)

  useEffect(() => {
    injectTokens(theme)
  }, [theme])

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <BrowserRouter>
          <Suspense fallback={<div style={{ background: 'var(--color-surface-bg)', minHeight: '100vh' }} />}>
            <AppRouter />
          </Suspense>
        </BrowserRouter>
      </ThemeContext.Provider>
    </I18nextProvider>
  )
}
```

- [ ] **Step 8.4: Create `packages/client/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 8.5: Typecheck**

```bash
cd packages/client && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 8.6: Build**

```bash
cd packages/client && pnpm build 2>&1
```

Expected: `dist/` created with `index.html` and hashed JS/CSS assets. No errors.

- [ ] **Step 8.7: Run full test suite (confirm no regressions)**

```bash
cd packages/client && pnpm test 2>&1
```

Expected: 36 tests passing.

**Paste the output verbatim.**

- [ ] **Step 8.8: Commit**

```bash
git add packages/client/src
git commit -m "feat(client): router, pantallas stub y shell de la aplicación"
```

---

## Task 9: Client Dockerfile + nginx + update docker-compose

**Files:**
- Create: `packages/client/Dockerfile`
- Create: `nginx/nginx.conf`
- Modify: `docker-compose.yml`

All commands run from `town77/` monorepo root.

- [ ] **Step 9.1: Create `packages/client/Dockerfile`**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/game-engine/package.json packages/game-engine/
COPY packages/client/package.json packages/client/
RUN pnpm install --frozen-lockfile

COPY packages/shared-types/src packages/shared-types/src
COPY packages/shared-types/tsconfig.json packages/shared-types/
COPY packages/game-engine/src packages/game-engine/src
COPY packages/game-engine/tsconfig.json packages/game-engine/
COPY packages/client/src packages/client/src
COPY packages/client/tsconfig.json packages/client/
COPY packages/client/vite.config.ts packages/client/
COPY packages/client/index.html packages/client/

RUN pnpm --filter @town77/shared-types run build \
 && pnpm --filter @town77/game-engine run build \
 && pnpm --filter @town77/client run build

FROM nginx:alpine AS production
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 9.2: Create `nginx/nginx.conf`**

```nginx
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;
  sendfile      on;
  gzip          on;
  gzip_types    text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

  server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /socket.io/ {
      proxy_pass         http://server:3001;
      proxy_http_version 1.1;
      proxy_set_header   Upgrade $http_upgrade;
      proxy_set_header   Connection "upgrade";
      proxy_set_header   Host $host;
      proxy_cache_bypass $http_upgrade;
    }

    location /health {
      proxy_pass http://server:3001/health;
    }

    location / {
      try_files $uri $uri/ /index.html;
    }
  }
}
```

- [ ] **Step 9.3: Update `docker-compose.yml`** — replace with full stack

```yaml
services:
  nginx:
    build:
      context: .
      dockerfile: packages/client/Dockerfile
      target: production
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped

  server:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
      target: production
    environment:
      NODE_ENV: production
      PORT: "3001"
      DB_PATH: /data/town77.db
      LOG_LEVEL: info
      CORS_ORIGIN: "*"
    volumes:
      - sqlite_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  sqlite_data:
```

- [ ] **Step 9.4: Build client Docker image**

```bash
docker build -f packages/client/Dockerfile --target production -t town77-client:latest . 2>&1 | tail -5
```

Expected: Build succeeds. Image tagged `town77-client:latest`.

- [ ] **Step 9.5: Smoke-test client container**

```bash
docker run --rm -d --name town77-client-smoke -p 8080:80 town77-client:latest
sleep 2
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
docker stop town77-client-smoke
```

Expected output: `200`

- [ ] **Step 9.6: Commit**

```bash
git add packages/client/Dockerfile nginx/nginx.conf docker-compose.yml
git commit -m "feat(client): Dockerfile Nginx y docker-compose completo"
```

---

## Phase 3 Complete

At this point:
- `@town77/client` — React 18 SPA:
  - Design tokens (CSS custom properties, 3-layer architecture)
  - Theme system (`ThemeContext` + `injectTokens` + town77 default theme)
  - i18n (Spanish + English, 5 namespaces, all game strings)
  - Zustand store + typed `socket.io-client`
  - Components: `Chip`, `Cell`, `Grid`, `Hand`, `PlayerBadge`, `ActionBar`
  - React Router v6 + screen stubs for all 5 routes
  - Vite build + Nginx Dockerfile
- docker-compose.yml: full stack (nginx → server → sqlite volume)
- Test suite: ~36 component and unit tests with Vitest + RTL

**Next:** Phase 4 — Client Screens (Home, Config, Lobby, Game with click-to-place, Results with score table)
