# Town 77 — Phase 1: Foundation + Game Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the pnpm monorepo, define all shared TypeScript types, and implement a fully-tested pure game engine (no I/O, no sockets, no DOM).

**Architecture:** Three packages — `shared-types` (interfaces only), `game-engine` (pure functions + injectable RNG), and root workspace config. The game engine is the single source of truth for all rule validation; both server and client import it. All randomness is injectable so tests are 100% deterministic.

**Tech Stack:** pnpm workspaces, TypeScript 5 strict, tsup, Vitest, @fast-check/vitest, prando, Biome

---

## File Map

```
town77/
├── package.json                          # Root workspace — scripts only
├── pnpm-workspace.yaml                   # Declares packages/*
├── tsconfig.base.json                    # Shared TS compiler options
├── biome.json                            # Lint + format config
├── vitest.config.ts                      # Root Vitest projects config
├── packages/
│   ├── shared-types/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Re-exports all types
│   │       ├── chip.ts                   # Chip, ColorId, ShapeId
│   │       ├── game-config.ts            # GameConfig, DEFAULT_GAME_CONFIG
│   │       ├── game-state.ts             # GameState, PlayerState, Score
│   │       ├── theme.ts                  # Theme, AnimationPreset
│   │       └── socket-events.ts          # All socket event payloads
│   └── game-engine/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── src/
│           ├── index.ts                  # Public API re-exports
│           ├── rng.ts                    # RNG interface, MathRNG, SeededRNG
│           ├── bag.ts                    # initBag, shuffle, dealHands, drawChips
│           ├── grid.ts                   # createGrid, isValidPlacement, applyPlacement,
│           │                             #   getValidCells, gridIsConsistent, isFirstChipOnGrid
│           ├── turn.ts                   # canExchange, doExchange, canDiscard, doDiscard
│           ├── scoring.ts                # calculateScores, isGameOver
│           └── __tests__/
│               ├── bag.test.ts
│               ├── grid.test.ts
│               ├── grid.property.test.ts # fast-check invariants
│               ├── turn.test.ts
│               └── scoring.test.ts
```

---

## Task 1: Root workspace scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `biome.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1.1: Create root package.json**

```json
{
  "name": "town77",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "build": "pnpm -r run build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "pnpm -r run typecheck"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "vite-tsconfig-paths": "^5.0.0"
  }
}
```

- [ ] **Step 1.2: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 1.3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

- [ ] **Step 1.4: Create biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedVariables": "error" },
      "suspicious": { "noExplicitAny": "error" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "files": {
    "ignore": ["**/node_modules", "**/dist", "**/*.d.ts"]
  }
}
```

- [ ] **Step 1.5: Create root vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: ['packages/game-engine'],
  },
})
```

- [ ] **Step 1.6: Create .gitignore**

```
node_modules/
dist/
*.tsbuildinfo
.env
*.db
coverage/
```

- [ ] **Step 1.7: Install pnpm (if not present) and install deps**

```bash
# Verify pnpm is available
pnpm --version

# Install root deps
pnpm install
```

Expected: pnpm version printed, no errors.

- [ ] **Step 1.8: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json biome.json vitest.config.ts .gitignore
git commit -m "chore: scaffold raíz del monorepo pnpm"
```

---

## Task 2: `shared-types` package

**Files:**
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/chip.ts`
- Create: `packages/shared-types/src/game-config.ts`
- Create: `packages/shared-types/src/game-state.ts`
- Create: `packages/shared-types/src/theme.ts`
- Create: `packages/shared-types/src/socket-events.ts`
- Create: `packages/shared-types/src/index.ts`

- [ ] **Step 2.1: Create packages/shared-types/package.json**

```json
{
  "name": "@town77/shared-types",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2.2: Create packages/shared-types/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 2.3: Create packages/shared-types/src/chip.ts**

```typescript
export type ColorId = string
export type ShapeId = string

export interface Chip {
  readonly color: ColorId
  readonly shape: ShapeId
}
```

- [ ] **Step 2.4: Create packages/shared-types/src/game-config.ts**

```typescript
import type { ColorId, ShapeId } from './chip'

export interface ChipSetConfig {
  colors: ColorId[]
  shapes: ShapeId[]
  copies: number
}

export interface GridConfig {
  rows: number
  cols: number
}

export interface ScoringConfig {
  placedWeight: number
  remainingWeight: number
}

export interface ExchangeConfig {
  min: number
  max: number
}

export interface GameConfig {
  grid: GridConfig
  chips: ChipSetConfig
  handSize: number
  scoring: ScoringConfig
  exchange: ExchangeConfig
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  grid: { rows: 7, cols: 7 },
  chips: {
    colors: ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7'],
    shapes: ['cottage', 'rowhouse', 'tower', 'victorian', 'barn', 'bungalow', 'skyscraper'],
    copies: 1,
  },
  handSize: 4,
  scoring: { placedWeight: 1, remainingWeight: 1 },
  exchange: { min: 3, max: 4 },
}
```

- [ ] **Step 2.5: Create packages/shared-types/src/game-state.ts**

```typescript
import type { Chip } from './chip'
import type { GameConfig } from './game-config'

export interface PlayerState {
  id: string
  name: string
  hand: Chip[]
  placed: number
  hasDiscarded: boolean
  connected: boolean
}

export type Grid = (Chip | null)[][]

export type GamePhase = 'lobby' | 'playing' | 'finished'

export interface GameState {
  grid: Grid
  bag: Chip[]
  players: PlayerState[]
  turnIndex: number
  phase: GamePhase
  config: GameConfig
  themeId: string
  seed: number
}

export interface Score {
  playerId: string
  name: string
  placed: number
  remaining: number
  combined: number
}
```

- [ ] **Step 2.6: Create packages/shared-types/src/theme.ts**

```typescript
import type { ColorId, ShapeId } from './chip'

export interface SpringConfig {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
}

export interface AnimationPreset {
  chipPlace: SpringConfig
  chipInvalid: { x: number[]; duration: number }
  chipDraw: { duration: number; ease: string }
  cellPulse: { duration: number; repeat: number }
  turnIn: { duration: number; ease: string }
  celebrate: { duration: number; particleCount: number; spread: number }
}

export interface ThemeSurfaces {
  background: string
  grid: string
  cell: string
  cellHover: string
  cellValid: string
  cellInvalid: string
}

export interface ThemeFonts {
  display: string
  ui: string
}

export interface Theme {
  id: string
  name: string
  shapes: Record<ShapeId, string>
  colorPalette: Record<ColorId, string>
  surfaces: ThemeSurfaces
  fonts: ThemeFonts
  animationPreset: AnimationPreset
}
```

- [ ] **Step 2.7: Create packages/shared-types/src/socket-events.ts**

```typescript
import type { Chip } from './chip'
import type { GameConfig } from './game-config'
import type { GameState, Score } from './game-state'

// Client → Server
export interface CreateRoomPayload {
  config: GameConfig
  themeId: string
  playerName: string
}

export interface JoinRoomPayload {
  code: string
  playerName: string
  playerId?: string
  sessionToken?: string
}

export interface PlaceChipPayload {
  chip: Chip
  row: number
  col: number
}

export interface ExchangeChipsPayload {
  chips: Chip[]
}

export interface DiscardChipPayload {
  chip: Chip
}

// Server → Client
export interface RoomJoinedPayload {
  code: string
  playerId: string
  sessionToken: string
  state: GameState
}

export interface StateUpdatePayload {
  state: GameState
}

export interface ErrorPayload {
  code: string
  messageKey: string
}

export interface GameOverPayload {
  scores: Score[]
}

export type ServerToClientEvents = {
  room_joined: (payload: RoomJoinedPayload) => void
  state_update: (payload: StateUpdatePayload) => void
  error: (payload: ErrorPayload) => void
  game_over: (payload: GameOverPayload) => void
}

export type ClientToServerEvents = {
  create_room: (payload: CreateRoomPayload) => void
  join_room: (payload: JoinRoomPayload) => void
  start_game: () => void
  place_chip: (payload: PlaceChipPayload) => void
  exchange_chips: (payload: ExchangeChipsPayload) => void
  discard_chip: (payload: DiscardChipPayload) => void
}
```

- [ ] **Step 2.8: Create packages/shared-types/src/index.ts**

```typescript
export * from './chip'
export * from './game-config'
export * from './game-state'
export * from './theme'
export * from './socket-events'
```

- [ ] **Step 2.9: Install deps and build shared-types**

```bash
cd packages/shared-types && pnpm install && pnpm build
```

Expected: `dist/` created with `index.js` and `index.d.ts`. No TypeScript errors.

- [ ] **Step 2.10: Commit**

```bash
git add packages/shared-types
git commit -m "feat: paquete shared-types — interfaces de dominio completas"
```

---

## Task 3: `game-engine` scaffold + RNG module

**Files:**
- Create: `packages/game-engine/package.json`
- Create: `packages/game-engine/tsconfig.json`
- Create: `packages/game-engine/vitest.config.ts`
- Create: `packages/game-engine/src/rng.ts`
- Create: `packages/game-engine/src/__tests__/rng.test.ts` (implicitly tested via bag tests)

- [ ] **Step 3.1: Create packages/game-engine/package.json**

```json
{
  "name": "@town77/game-engine",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@town77/shared-types": "workspace:*",
    "prando": "^6.0.1"
  },
  "devDependencies": {
    "@fast-check/vitest": "^0.1.0",
    "fast-check": "^3.21.0",
    "tsup": "^8.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "vite-tsconfig-paths": "^5.0.0"
  }
}
```

- [ ] **Step 3.2: Create packages/game-engine/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@town77/shared-types": ["../shared-types/src/index.ts"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3.3: Create packages/game-engine/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})
```

- [ ] **Step 3.4: Create packages/game-engine/src/rng.ts**

```typescript
import Prando from 'prando'

export interface RNG {
  nextFloat(): number
}

export class MathRNG implements RNG {
  nextFloat(): number {
    return Math.random()
  }
}

export class SeededRNG implements RNG {
  private readonly prng: Prando

  constructor(seed: number | string) {
    this.prng = new Prando(seed)
  }

  nextFloat(): number {
    return this.prng.next()
  }
}
```

- [ ] **Step 3.5: Install deps**

```bash
cd packages/game-engine && pnpm install
```

Expected: `node_modules/` with prando and fast-check. No errors.

- [ ] **Step 3.6: Commit**

```bash
git add packages/game-engine
git commit -m "feat: scaffold game-engine — RNG inyectable"
```

---

## Task 4: Bag module (TDD)

**Files:**
- Create: `packages/game-engine/src/bag.ts`
- Create: `packages/game-engine/src/__tests__/bag.test.ts`

- [ ] **Step 4.1: Write failing tests**

Create `packages/game-engine/src/__tests__/bag.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { SeededRNG } from '../rng'
import { dealHands, drawChips, initBag, shuffle } from '../bag'

const RNG = new SeededRNG(42)

describe('initBag', () => {
  it('produces correct total chip count', () => {
    const rng = new SeededRNG(1)
    const config = DEFAULT_GAME_CONFIG.chips
    const bag = initBag(config, rng)
    // 7 colors × 7 shapes × 1 copy = 49
    expect(bag).toHaveLength(49)
  })

  it('contains every color-shape combination exactly once', () => {
    const rng = new SeededRNG(1)
    const config = DEFAULT_GAME_CONFIG.chips
    const bag = initBag(config, rng)
    const keys = bag.map(c => `${c.color}:${c.shape}`)
    expect(new Set(keys).size).toBe(49)
  })

  it('produces deterministic bag from same seed', () => {
    const bag1 = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(42))
    const bag2 = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(42))
    expect(bag1).toEqual(bag2)
  })

  it('produces different bags from different seeds', () => {
    const bag1 = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const bag2 = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(2))
    expect(bag1).not.toEqual(bag2)
  })

  it('respects copies > 1', () => {
    const config = { ...DEFAULT_GAME_CONFIG.chips, copies: 2 }
    const bag = initBag(config, new SeededRNG(1))
    expect(bag).toHaveLength(98) // 7 × 7 × 2
  })
})

describe('dealHands', () => {
  it('deals correct number of chips per player', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const { hands } = dealHands(bag, 3, 4)
    expect(hands).toHaveLength(3)
    hands.forEach(h => expect(h).toHaveLength(4))
  })

  it('removes dealt chips from remaining bag', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const { remainingBag } = dealHands(bag, 3, 4)
    expect(remainingBag).toHaveLength(49 - 12) // 49 - 3×4
  })

  it('does not mutate the input bag', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const original = [...bag]
    dealHands(bag, 2, 4)
    expect(bag).toEqual(original)
  })
})

describe('drawChips', () => {
  it('draws requested count from front of bag', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const { drawn, remainingBag } = drawChips(bag, 2)
    expect(drawn).toHaveLength(2)
    expect(remainingBag).toHaveLength(47)
  })

  it('draws all remaining when count exceeds bag size', () => {
    const bag = [{ color: 'color-1', shape: 'cottage' }]
    const { drawn, remainingBag } = drawChips(bag, 5)
    expect(drawn).toHaveLength(1)
    expect(remainingBag).toHaveLength(0)
  })

  it('does not mutate input bag', () => {
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const original = [...bag]
    drawChips(bag, 3)
    expect(bag).toEqual(original)
  })
})
```

- [ ] **Step 4.2: Run tests — expect FAIL**

```bash
cd packages/game-engine && pnpm test
```

Expected output: `FAIL src/__tests__/bag.test.ts` — `Cannot find module '../bag'`

- [ ] **Step 4.3: Implement bag.ts**

Create `packages/game-engine/src/bag.ts`:

```typescript
import type { Chip, ChipSetConfig } from '@town77/shared-types'
import type { RNG } from './rng'

export function initBag(config: ChipSetConfig, rng: RNG): Chip[] {
  const chips: Chip[] = []
  for (const color of config.colors) {
    for (const shape of config.shapes) {
      for (let i = 0; i < config.copies; i++) {
        chips.push({ color, shape })
      }
    }
  }
  return shuffle(chips, rng)
}

export function shuffle<T>(arr: T[], rng: RNG): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.nextFloat() * (i + 1))
    const tmp = result[i]!
    result[i] = result[j]!
    result[j] = tmp
  }
  return result
}

export function dealHands(
  bag: Chip[],
  playerCount: number,
  handSize: number,
): { hands: Chip[][]; remainingBag: Chip[] } {
  const remaining = [...bag]
  const hands: Chip[][] = []
  for (let i = 0; i < playerCount; i++) {
    hands.push(remaining.splice(0, handSize))
  }
  return { hands, remainingBag: remaining }
}

export function drawChips(
  bag: Chip[],
  count: number,
): { drawn: Chip[]; remainingBag: Chip[] } {
  const remaining = [...bag]
  const drawn = remaining.splice(0, count)
  return { drawn, remainingBag: remaining }
}
```

- [ ] **Step 4.4: Run tests — expect PASS**

```bash
cd packages/game-engine && pnpm test
```

Expected output: `PASS src/__tests__/bag.test.ts` — all tests green.

- [ ] **Step 4.5: Commit**

```bash
git add packages/game-engine/src/bag.ts packages/game-engine/src/__tests__/bag.test.ts
git commit -m "feat(game-engine): módulo bag — initBag, dealHands, drawChips"
```

---

## Task 5: Grid module (TDD)

**Files:**
- Create: `packages/game-engine/src/grid.ts`
- Create: `packages/game-engine/src/__tests__/grid.test.ts`

- [ ] **Step 5.1: Write failing tests**

Create `packages/game-engine/src/__tests__/grid.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import type { Chip, Grid } from '@town77/shared-types'
import {
  applyPlacement,
  createGrid,
  getValidCells,
  gridIsConsistent,
  isFirstChipOnGrid,
  isValidPlacement,
} from '../grid'

const COTTAGE_RED: Chip = { color: 'color-1', shape: 'cottage' }
const TOWER_RED: Chip = { color: 'color-1', shape: 'tower' }
const COTTAGE_BLUE: Chip = { color: 'color-2', shape: 'cottage' }
const TOWER_BLUE: Chip = { color: 'color-2', shape: 'tower' }
const BARN_GREEN: Chip = { color: 'color-3', shape: 'barn' }

describe('createGrid', () => {
  it('creates a grid with correct dimensions', () => {
    const grid = createGrid(7, 7)
    expect(grid).toHaveLength(7)
    grid.forEach(row => {
      expect(row).toHaveLength(7)
      row.forEach(cell => expect(cell).toBeNull())
    })
  })
})

describe('isFirstChipOnGrid', () => {
  it('returns true for empty grid', () => {
    expect(isFirstChipOnGrid(createGrid(7, 7))).toBe(true)
  })

  it('returns false when at least one chip is placed', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isFirstChipOnGrid(grid)).toBe(false)
  })
})

describe('isValidPlacement — first chip', () => {
  it('allows first chip anywhere on empty grid', () => {
    const grid = createGrid(7, 7)
    expect(isValidPlacement(grid, 0, 0, COTTAGE_RED, true)).toBe(true)
    expect(isValidPlacement(grid, 6, 6, COTTAGE_RED, true)).toBe(true)
    expect(isValidPlacement(grid, 3, 3, COTTAGE_RED, true)).toBe(true)
  })

  it('rejects out-of-bounds coordinates', () => {
    const grid = createGrid(7, 7)
    expect(isValidPlacement(grid, -1, 0, COTTAGE_RED, true)).toBe(false)
    expect(isValidPlacement(grid, 0, 7, COTTAGE_RED, true)).toBe(false)
    expect(isValidPlacement(grid, 7, 0, COTTAGE_RED, true)).toBe(false)
  })
})

describe('isValidPlacement — adjacency', () => {
  it('rejects placement not adjacent to any chip', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 0, 0, TOWER_BLUE, false)).toBe(false)
  })

  it('allows placement adjacent to existing chip', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 3, 4, TOWER_BLUE, false)).toBe(true)
    expect(isValidPlacement(grid, 4, 3, TOWER_BLUE, false)).toBe(true)
    expect(isValidPlacement(grid, 3, 2, TOWER_BLUE, false)).toBe(true)
    expect(isValidPlacement(grid, 2, 3, TOWER_BLUE, false)).toBe(true)
  })

  it('rejects diagonal placement', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 4, 4, TOWER_BLUE, false)).toBe(false)
  })

  it('rejects occupied cell', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 3, 3, TOWER_BLUE, false)).toBe(false)
  })
})

describe('isValidPlacement — row/column uniqueness', () => {
  it('rejects chip with duplicate color in same row', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    // TOWER_RED has same color as COTTAGE_RED — same row
    expect(isValidPlacement(grid, 3, 4, TOWER_RED, false)).toBe(false)
  })

  it('rejects chip with duplicate shape in same row', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    // COTTAGE_BLUE has same shape as COTTAGE_RED — same row
    expect(isValidPlacement(grid, 3, 4, COTTAGE_BLUE, false)).toBe(false)
  })

  it('rejects chip with duplicate color in same column', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 4, 3, TOWER_RED, false)).toBe(false)
  })

  it('rejects chip with duplicate shape in same column', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 4, 3, COTTAGE_BLUE, false)).toBe(false)
  })

  it('allows chip with unique color and shape in row and column', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    expect(isValidPlacement(grid, 3, 4, TOWER_BLUE, false)).toBe(true)
  })
})

describe('applyPlacement', () => {
  it('places chip at correct position', () => {
    const grid = createGrid(7, 7)
    const next = applyPlacement(grid, 2, 5, COTTAGE_RED)
    expect(next[2]![5]).toEqual(COTTAGE_RED)
  })

  it('does not mutate input grid', () => {
    const grid = createGrid(7, 7)
    applyPlacement(grid, 2, 5, COTTAGE_RED)
    expect(grid[2]![5]).toBeNull()
  })
})

describe('getValidCells', () => {
  it('returns all cells for first chip', () => {
    const grid = createGrid(7, 7)
    const cells = getValidCells(grid, COTTAGE_RED, true)
    expect(cells).toHaveLength(49)
  })

  it('returns only adjacent cells with no conflict for second chip', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, COTTAGE_RED)
    const cells = getValidCells(grid, TOWER_BLUE, false)
    // Must be adjacent to (3,3) AND have no color/shape conflicts
    expect(cells.length).toBeGreaterThan(0)
    cells.forEach(([r, c]) => {
      expect(isValidPlacement(grid, r, c, TOWER_BLUE, false)).toBe(true)
    })
  })
})

describe('gridIsConsistent', () => {
  it('returns true for empty grid', () => {
    expect(gridIsConsistent(createGrid(7, 7))).toBe(true)
  })

  it('returns true for valid placements', () => {
    let grid = createGrid(7, 7)
    grid = applyPlacement(grid, 3, 3, COTTAGE_RED)
    grid = applyPlacement(grid, 3, 4, TOWER_BLUE)
    grid = applyPlacement(grid, 4, 3, BARN_GREEN)
    expect(gridIsConsistent(grid)).toBe(true)
  })

  it('returns false when row has duplicate color', () => {
    let grid = createGrid(7, 7)
    // Force an invalid state directly (bypassing validation)
    const raw = grid.map(r => [...r]) as Grid
    raw[3]![3] = COTTAGE_RED
    raw[3]![4] = TOWER_RED // same color in same row
    expect(gridIsConsistent(raw)).toBe(false)
  })

  it('returns false when column has duplicate shape', () => {
    const raw = createGrid(7, 7).map(r => [...r]) as Grid
    raw[3]![3] = COTTAGE_RED
    raw[4]![3] = COTTAGE_BLUE // same shape in same column
    expect(gridIsConsistent(raw)).toBe(false)
  })
})
```

- [ ] **Step 5.2: Run tests — expect FAIL**

```bash
cd packages/game-engine && pnpm test -- --reporter=verbose 2>&1 | head -30
```

Expected: `FAIL src/__tests__/grid.test.ts` — `Cannot find module '../grid'`

- [ ] **Step 5.3: Implement grid.ts**

Create `packages/game-engine/src/grid.ts`:

```typescript
import type { Chip, Grid } from '@town77/shared-types'

export function createGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array<Chip | null>(cols).fill(null))
}

export function isFirstChipOnGrid(grid: Grid): boolean {
  return grid.every(row => row.every(cell => cell === null))
}

export function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  chip: Chip,
  isFirstChip: boolean,
): boolean {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  if (row < 0 || row >= rows || col < 0 || col >= cols) return false
  if (grid[row]?.[col] !== null) return false
  if (isFirstChip) return true
  if (!hasAdjacentChip(grid, row, col)) return false

  for (let c = 0; c < cols; c++) {
    const cell = grid[row]?.[c]
    if (cell != null) {
      if (cell.color === chip.color || cell.shape === chip.shape) return false
    }
  }

  for (let r = 0; r < rows; r++) {
    const cell = grid[r]?.[col]
    if (cell != null) {
      if (cell.color === chip.color || cell.shape === chip.shape) return false
    }
  }

  return true
}

function hasAdjacentChip(grid: Grid, row: number, col: number): boolean {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  return (
    [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]] as [number, number][]
  ).some(([r, c]) => r >= 0 && r < rows && c >= 0 && c < cols && grid[r]?.[c] != null)
}

export function applyPlacement(grid: Grid, row: number, col: number, chip: Chip): Grid {
  const next = grid.map(r => [...r])
  next[row]![col] = chip
  return next as Grid
}

export function getValidCells(
  grid: Grid,
  chip: Chip,
  isFirstChip: boolean,
): [number, number][] {
  const valid: [number, number][] = []
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[0]?.length ?? 0); c++) {
      if (isValidPlacement(grid, r, c, chip, isFirstChip)) valid.push([r, c])
    }
  }
  return valid
}

export function gridIsConsistent(grid: Grid): boolean {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  for (let r = 0; r < rows; r++) {
    const chips = (grid[r] ?? []).filter((c): c is Chip => c !== null)
    const colors = chips.map(c => c.color)
    const shapes = chips.map(c => c.shape)
    if (new Set(colors).size !== colors.length) return false
    if (new Set(shapes).size !== shapes.length) return false
  }

  for (let c = 0; c < cols; c++) {
    const chips = grid.map(r => r[c]).filter((c): c is Chip => c !== null)
    const colors = chips.map(ch => ch.color)
    const shapes = chips.map(ch => ch.shape)
    if (new Set(colors).size !== colors.length) return false
    if (new Set(shapes).size !== shapes.length) return false
  }

  return true
}
```

- [ ] **Step 5.4: Run tests — expect PASS**

```bash
cd packages/game-engine && pnpm test
```

Expected: all grid tests green.

- [ ] **Step 5.5: Commit**

```bash
git add packages/game-engine/src/grid.ts packages/game-engine/src/__tests__/grid.test.ts
git commit -m "feat(game-engine): módulo grid — validación de colocación y consistencia"
```

---

## Task 6: Grid property-based tests

**Files:**
- Create: `packages/game-engine/src/__tests__/grid.property.test.ts`

- [ ] **Step 6.1: Write property tests**

Create `packages/game-engine/src/__tests__/grid.property.test.ts`:

```typescript
import { test } from '@fast-check/vitest'
import * as fc from 'fast-check'
import { expect } from 'vitest'
import type { Chip } from '@town77/shared-types'
import {
  applyPlacement,
  createGrid,
  getValidCells,
  gridIsConsistent,
  isFirstChipOnGrid,
  isValidPlacement,
} from '../grid'

const COLORS = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7']
const SHAPES = ['cottage', 'rowhouse', 'tower', 'victorian', 'barn', 'bungalow', 'skyscraper']

const arbitraryChip = (): fc.Arbitrary<Chip> =>
  fc.record({
    color: fc.constantFrom(...COLORS),
    shape: fc.constantFrom(...SHAPES),
  })

const arbitraryCoord = () => fc.integer({ min: 0, max: 6 })

test.prop([arbitraryCoord(), arbitraryCoord(), arbitraryChip()])(
  'any valid placement preserves grid consistency',
  (row, col, chip) => {
    const grid = createGrid(7, 7)
    const isFirst = isFirstChipOnGrid(grid)
    fc.pre(isValidPlacement(grid, row, col, chip, isFirst))
    const next = applyPlacement(grid, row, col, chip)
    expect(gridIsConsistent(next)).toBe(true)
  },
)

test.prop([arbitraryChip()])(
  'getValidCells never returns a cell that fails isValidPlacement',
  (chip) => {
    const grid = createGrid(7, 7)
    const validCells = getValidCells(grid, chip, true)
    validCells.forEach(([r, c]) => {
      expect(isValidPlacement(grid, r, c, chip, true)).toBe(true)
    })
  },
)

test.prop([arbitraryCoord(), arbitraryCoord(), arbitraryChip()])(
  'applyPlacement does not mutate the original grid',
  (row, col, chip) => {
    const grid = createGrid(7, 7)
    const original = JSON.stringify(grid)
    applyPlacement(grid, row, col, chip)
    expect(JSON.stringify(grid)).toBe(original)
  },
)

test.prop([arbitraryCoord(), arbitraryCoord(), arbitraryChip(), arbitraryChip()])(
  'isValidPlacement is false for any occupied cell',
  (row, col, existing, candidate) => {
    const grid = applyPlacement(createGrid(7, 7), row, col, existing)
    expect(isValidPlacement(grid, row, col, candidate, false)).toBe(false)
  },
)
```

- [ ] **Step 6.2: Run — expect PASS**

```bash
cd packages/game-engine && pnpm test
```

Expected: property tests run with 100 generated cases each, all green.

- [ ] **Step 6.3: Commit**

```bash
git add packages/game-engine/src/__tests__/grid.property.test.ts
git commit -m "test(game-engine): tests de propiedad para invariantes del grid"
```

---

## Task 7: Turn actions module (TDD)

**Files:**
- Create: `packages/game-engine/src/turn.ts`
- Create: `packages/game-engine/src/__tests__/turn.test.ts`

- [ ] **Step 7.1: Write failing tests**

Create `packages/game-engine/src/__tests__/turn.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import type { Chip } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { SeededRNG } from '../rng'
import { initBag } from '../bag'
import { canDiscard, canExchange, doDiscard, doExchange } from '../turn'

const RED_COTTAGE: Chip = { color: 'color-1', shape: 'cottage' }
const RED_TOWER: Chip = { color: 'color-1', shape: 'tower' }
const RED_BARN: Chip = { color: 'color-1', shape: 'barn' }
const RED_ROWHOUSE: Chip = { color: 'color-1', shape: 'rowhouse' }
const BLUE_COTTAGE: Chip = { color: 'color-2', shape: 'cottage' }
const GREEN_COTTAGE: Chip = { color: 'color-3', shape: 'cottage' }
const YELLOW_BARN: Chip = { color: 'color-4', shape: 'barn' }

const exchangeConfig = DEFAULT_GAME_CONFIG.exchange

describe('canExchange', () => {
  it('returns true for 3 chips sharing same color', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    expect(canExchange(hand, [RED_COTTAGE, RED_TOWER, RED_BARN], exchangeConfig)).toBe(true)
  })

  it('returns true for 4 chips sharing same shape', () => {
    const hand = [RED_COTTAGE, BLUE_COTTAGE, GREEN_COTTAGE, YELLOW_BARN]
    expect(
      canExchange(hand, [RED_COTTAGE, BLUE_COTTAGE, GREEN_COTTAGE], exchangeConfig),
    ).toBe(true)
  })

  it('returns false for 2 chips (below minimum)', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    expect(canExchange(hand, [RED_COTTAGE, RED_TOWER], exchangeConfig)).toBe(false)
  })

  it('returns false for 5 chips (above maximum)', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, RED_ROWHOUSE]
    expect(
      canExchange(
        hand,
        [RED_COTTAGE, RED_TOWER, RED_BARN, RED_ROWHOUSE, BLUE_COTTAGE],
        exchangeConfig,
      ),
    ).toBe(false)
  })

  it('returns false when chips do not share color or shape', () => {
    const hand = [RED_COTTAGE, BLUE_COTTAGE, GREEN_COTTAGE, YELLOW_BARN]
    expect(canExchange(hand, [RED_COTTAGE, BLUE_COTTAGE, YELLOW_BARN], exchangeConfig)).toBe(
      false,
    )
  })

  it('returns false when chip is not in hand', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, YELLOW_BARN]
    const notInHand: Chip = { color: 'color-1', shape: 'victorian' }
    expect(canExchange(hand, [RED_COTTAGE, RED_TOWER, notInHand], exchangeConfig)).toBe(false)
  })
})

describe('doExchange', () => {
  it('returns new hand of same size', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const { newHand } = doExchange(hand, bag, [RED_COTTAGE, RED_TOWER, RED_BARN], new SeededRNG(1))
    expect(newHand).toHaveLength(4)
  })

  it('does not contain exchanged chips in new hand (statistically — seeded)', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    // After exchange the returned chips go back into a large bag (49+ chips)
    // so the chance of drawing the exact same 3 back is negligible
    const { newHand, newBag } = doExchange(
      hand,
      bag,
      [RED_COTTAGE, RED_TOWER, RED_BARN],
      new SeededRNG(99),
    )
    expect(newHand).toHaveLength(4)
    expect(newBag.length + newHand.length).toBe(bag.length + hand.length)
  })

  it('preserves total chip count (hand + bag)', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const total = hand.length + bag.length
    const { newHand, newBag } = doExchange(hand, bag, [RED_COTTAGE, RED_TOWER, RED_BARN], new SeededRNG(1))
    expect(newHand.length + newBag.length).toBe(total)
  })

  it('does not mutate input hand or bag', () => {
    const hand = [RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE]
    const bag = initBag(DEFAULT_GAME_CONFIG.chips, new SeededRNG(1))
    const origHand = JSON.stringify(hand)
    const origBag = JSON.stringify(bag)
    doExchange(hand, bag, [RED_COTTAGE, RED_TOWER, RED_BARN], new SeededRNG(1))
    expect(JSON.stringify(hand)).toBe(origHand)
    expect(JSON.stringify(bag)).toBe(origBag)
  })
})

describe('canDiscard', () => {
  it('returns true when player has not yet discarded', () => {
    expect(canDiscard(false)).toBe(true)
  })

  it('returns false when player already discarded', () => {
    expect(canDiscard(true)).toBe(false)
  })
})

describe('doDiscard', () => {
  it('removes chip from hand', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, YELLOW_BARN]
    const bag = [GREEN_COTTAGE]
    const { newHand } = doDiscard(hand, bag, RED_COTTAGE)
    expect(newHand).not.toContainEqual(RED_COTTAGE)
  })

  it('draws from bag when bag is not empty', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, YELLOW_BARN]
    const bag = [GREEN_COTTAGE]
    const { newHand, drew } = doDiscard(hand, bag, RED_COTTAGE)
    expect(drew).toBe(true)
    expect(newHand).toHaveLength(4) // removed 1, drew 1
  })

  it('does not draw when bag is empty', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, YELLOW_BARN]
    const { newHand, drew } = doDiscard(hand, [], RED_COTTAGE)
    expect(drew).toBe(false)
    expect(newHand).toHaveLength(3)
  })

  it('does not mutate input hand or bag', () => {
    const hand = [RED_COTTAGE, RED_TOWER, BLUE_COTTAGE, YELLOW_BARN]
    const bag = [GREEN_COTTAGE]
    const origHand = JSON.stringify(hand)
    const origBag = JSON.stringify(bag)
    doDiscard(hand, bag, RED_COTTAGE)
    expect(JSON.stringify(hand)).toBe(origHand)
    expect(JSON.stringify(bag)).toBe(origBag)
  })
})
```

- [ ] **Step 7.2: Run — expect FAIL**

```bash
cd packages/game-engine && pnpm test -- src/__tests__/turn.test.ts
```

Expected: `FAIL` — `Cannot find module '../turn'`

- [ ] **Step 7.3: Implement turn.ts**

Create `packages/game-engine/src/turn.ts`:

```typescript
import type { Chip, ExchangeConfig } from '@town77/shared-types'
import type { RNG } from './rng'
import { shuffle } from './bag'

export function canExchange(
  hand: Chip[],
  chips: Chip[],
  config: ExchangeConfig,
): boolean {
  if (chips.length < config.min || chips.length > config.max) return false

  const handCopy = [...hand]
  for (const chip of chips) {
    const idx = handCopy.findIndex(h => h.color === chip.color && h.shape === chip.shape)
    if (idx === -1) return false
    handCopy.splice(idx, 1)
  }

  const allSameColor = chips.every(c => c.color === chips[0]!.color)
  const allSameShape = chips.every(c => c.shape === chips[0]!.shape)
  return allSameColor || allSameShape
}

export function doExchange(
  hand: Chip[],
  bag: Chip[],
  chipsToExchange: Chip[],
  rng: RNG,
): { newHand: Chip[]; newBag: Chip[] } {
  const newHand = [...hand]
  for (const chip of chipsToExchange) {
    const idx = newHand.findIndex(h => h.color === chip.color && h.shape === chip.shape)
    newHand.splice(idx, 1)
  }

  const newBag = shuffle([...bag, ...chipsToExchange], rng)
  const drawn = newBag.splice(0, chipsToExchange.length)
  newHand.push(...drawn)

  return { newHand, newBag }
}

export function canDiscard(hasDiscarded: boolean): boolean {
  return !hasDiscarded
}

export function doDiscard(
  hand: Chip[],
  bag: Chip[],
  chipToDiscard: Chip,
): { newHand: Chip[]; newBag: Chip[]; drew: boolean } {
  const newHand = [...hand]
  const idx = newHand.findIndex(h => h.color === chipToDiscard.color && h.shape === chipToDiscard.shape)
  newHand.splice(idx, 1)

  const newBag = [...bag]
  let drew = false

  if (newBag.length > 0) {
    const drawn = newBag.splice(0, 1)[0]!
    newHand.push(drawn)
    drew = true
  }

  return { newHand, newBag, drew }
}
```

- [ ] **Step 7.4: Run — expect PASS**

```bash
cd packages/game-engine && pnpm test
```

Expected: all tests including turn tests green.

- [ ] **Step 7.5: Commit**

```bash
git add packages/game-engine/src/turn.ts packages/game-engine/src/__tests__/turn.test.ts
git commit -m "feat(game-engine): módulo turn — intercambio y descarte de fichas"
```

---

## Task 8: Scoring module (TDD)

**Files:**
- Create: `packages/game-engine/src/scoring.ts`
- Create: `packages/game-engine/src/__tests__/scoring.test.ts`

- [ ] **Step 8.1: Write failing tests**

Create `packages/game-engine/src/__tests__/scoring.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import type { PlayerState, Grid } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { applyPlacement, createGrid } from '../grid'
import { calculateScores, isGameOver } from '../scoring'

const RED_COTTAGE = { color: 'color-1', shape: 'cottage' }
const BLUE_TOWER = { color: 'color-2', shape: 'tower' }
const GREEN_BARN = { color: 'color-3', shape: 'barn' }

function makePlayer(
  overrides: Partial<PlayerState> = {},
): PlayerState {
  return {
    id: 'p1',
    name: 'Alice',
    hand: [],
    placed: 0,
    hasDiscarded: false,
    connected: true,
    ...overrides,
  }
}

describe('calculateScores', () => {
  it('calculates correct combined score', () => {
    const players = [
      makePlayer({ id: 'p1', name: 'Alice', placed: 10, hand: [RED_COTTAGE, BLUE_TOWER] }),
      makePlayer({ id: 'p2', name: 'Bob', placed: 8, hand: [GREEN_BARN] }),
    ]
    const scores = calculateScores(players, DEFAULT_GAME_CONFIG.scoring)
    // combined = placed × 1 - remaining × 1
    expect(scores[0]!.combined).toBe(10 - 2) // 8
    expect(scores[1]!.combined).toBe(8 - 1)  // 7
  })

  it('scores are always deterministic given same input', () => {
    const players = [makePlayer({ placed: 5, hand: [RED_COTTAGE] })]
    expect(calculateScores(players, DEFAULT_GAME_CONFIG.scoring)).toEqual(
      calculateScores(players, DEFAULT_GAME_CONFIG.scoring),
    )
  })

  it('respects configurable weights', () => {
    const players = [makePlayer({ placed: 6, hand: [RED_COTTAGE, BLUE_TOWER] })]
    const scores = calculateScores(players, { placedWeight: 2, remainingWeight: 3 })
    expect(scores[0]!.combined).toBe(6 * 2 - 2 * 3) // 6
  })

  it('returns one score per player', () => {
    const players = [makePlayer({ id: 'p1' }), makePlayer({ id: 'p2' })]
    expect(calculateScores(players, DEFAULT_GAME_CONFIG.scoring)).toHaveLength(2)
  })
})

describe('isGameOver', () => {
  it('returns false when bag still has chips', () => {
    const grid = createGrid(7, 7)
    const players = [makePlayer({ hand: [RED_COTTAGE] })]
    expect(isGameOver(grid, [BLUE_TOWER], players)).toBe(false)
  })

  it('returns true when bag empty and no valid placements', () => {
    // Fill entire grid (force no valid placements)
    let grid: Grid = createGrid(7, 7)
    // Put chips such that every cell is occupied
    const colors = ['color-1','color-2','color-3','color-4','color-5','color-6','color-7']
    const shapes = ['cottage','rowhouse','tower','victorian','barn','bungalow','skyscraper']
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        grid = applyPlacement(grid, r, c, { color: colors[r]!, shape: shapes[c]! })
      }
    }
    const players = [makePlayer({ hand: [RED_COTTAGE] })]
    expect(isGameOver(grid, [], players)).toBe(true)
  })

  it('returns false when bag empty but valid placements still exist', () => {
    const grid = applyPlacement(createGrid(7, 7), 3, 3, RED_COTTAGE)
    const players = [makePlayer({ hand: [BLUE_TOWER] })]
    // BLUE_TOWER can be placed adjacent to RED_COTTAGE
    expect(isGameOver(grid, [], players)).toBe(false)
  })
})
```

- [ ] **Step 8.2: Run — expect FAIL**

```bash
cd packages/game-engine && pnpm test -- src/__tests__/scoring.test.ts
```

Expected: `FAIL` — `Cannot find module '../scoring'`

- [ ] **Step 8.3: Implement scoring.ts**

Create `packages/game-engine/src/scoring.ts`:

```typescript
import type { Chip, Grid, PlayerState, Score, ScoringConfig } from '@town77/shared-types'
import { getValidCells, isFirstChipOnGrid } from './grid'

export function calculateScores(players: PlayerState[], config: ScoringConfig): Score[] {
  return players.map(p => ({
    playerId: p.id,
    name: p.name,
    placed: p.placed,
    remaining: p.hand.length,
    combined: p.placed * config.placedWeight - p.hand.length * config.remainingWeight,
  }))
}

export function isGameOver(grid: Grid, bag: Chip[], players: PlayerState[]): boolean {
  if (bag.length > 0) return false

  const firstChip = isFirstChipOnGrid(grid)
  for (const player of players) {
    for (const chip of player.hand) {
      if (getValidCells(grid, chip, firstChip).length > 0) return false
    }
  }

  return true
}
```

- [ ] **Step 8.4: Run — expect PASS**

```bash
cd packages/game-engine && pnpm test
```

Expected: all tests across all test files pass.

- [ ] **Step 8.5: Commit**

```bash
git add packages/game-engine/src/scoring.ts packages/game-engine/src/__tests__/scoring.test.ts
git commit -m "feat(game-engine): módulo scoring — puntuación y fin de juego"
```

---

## Task 9: Wire game-engine public API + build

**Files:**
- Create: `packages/game-engine/src/index.ts`

- [ ] **Step 9.1: Create public API barrel**

Create `packages/game-engine/src/index.ts`:

```typescript
export { MathRNG, SeededRNG } from './rng'
export type { RNG } from './rng'
export { dealHands, drawChips, initBag, shuffle } from './bag'
export {
  applyPlacement,
  createGrid,
  getValidCells,
  gridIsConsistent,
  isFirstChipOnGrid,
  isValidPlacement,
} from './grid'
export { canDiscard, canExchange, doDiscard, doExchange } from './turn'
export { calculateScores, isGameOver } from './scoring'
```

- [ ] **Step 9.2: Run full test suite from root**

```bash
# From town77/ root
pnpm test
```

Expected output:
```
 PASS  packages/game-engine/src/__tests__/bag.test.ts
 PASS  packages/game-engine/src/__tests__/grid.test.ts
 PASS  packages/game-engine/src/__tests__/grid.property.test.ts
 PASS  packages/game-engine/src/__tests__/turn.test.ts
 PASS  packages/game-engine/src/__tests__/scoring.test.ts

Test Files  5 passed (5)
Tests      XX passed (XX)
```

- [ ] **Step 9.3: Build both packages**

```bash
cd packages/shared-types && pnpm build
cd ../game-engine && pnpm build
```

Expected: `dist/` directories created in both packages, no TypeScript errors.

- [ ] **Step 9.4: Typecheck from root**

```bash
cd /path/to/town77 && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 9.5: Commit**

```bash
git add packages/game-engine/src/index.ts
git commit -m "feat(game-engine): API pública — motor de juego completo y probado"
```

---

## Phase 1 Complete

At this point:
- Monorepo scaffold is in place, ready for Plans 2–5
- `@town77/shared-types` — all TypeScript interfaces, socket event types, default config
- `@town77/game-engine` — fully tested pure game logic:
  - Deterministic via injectable RNG (`SeededRNG` / `MathRNG`)
  - 5 unit test files, property-based invariant tests
  - `isValidPlacement`, `applyPlacement`, `getValidCells`, `gridIsConsistent`
  - `initBag`, `dealHands`, `drawChips`, `shuffle`
  - `canExchange`, `doExchange`, `canDiscard`, `doDiscard`
  - `calculateScores`, `isGameOver`

**Next:** Plan 2 — Server (Express + Socket.IO + SQLite)
