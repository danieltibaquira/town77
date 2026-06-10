# Town 77 — Phase 4: Client Screens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing component library to the Socket.IO server through fully-functional game screens — Config, Join, Lobby, Game, and Results — with session recovery, error handling, and navigation guards.

**Architecture:** Each screen is a smart component that reads from the Zustand store and emits socket events. A `useGameConnection` hook manages the socket lifecycle at the screen level. Client-side validation uses `@town77/game-engine` (already a dependency) for instant UX feedback (valid cell highlighting). Interaction model is click-to-select + click-to-place (no drag-and-drop in this phase — testable, accessible, mobile-friendly).

**Tech Stack:** React 18, Zustand 5, react-router-dom v6, react-i18next, @town77/game-engine, Vitest 2, @testing-library/react 16, @testing-library/user-event 14, jsdom

**Spec references:**
- `docs/superpowers/specs/2026-06-09-town77-design.md` (§7 Screens, §4 Socket Events, §10 Error Handling)
- `docs/design-system/spec-theme-and-voice.md` (§8 Component API)
- Existing Phase 3 components: Chip, Cell, Grid, Hand, PlayerBadge, ActionBar

---

## TDD Rules for This Phase

1. **Never write implementation before a failing test exists** for that behavior.
2. **One commit per green task** (or per logical sub-task where noted).
3. **Run the narrowest test file first**, then full client suite.
4. **Phase 3 + 3.5 tests must stay green** — run full suite after each task.
5. **No inline styles with hardcoded colors** — use CSS tokens only.
6. **All user-facing strings use `t()`** — no hardcoded text in JSX.

```bash
# Single test file
cd packages/client && pnpm test -- src/__tests__/screens/ConfigScreen.test.tsx

# Full suite
cd /Users/danieltibaquira/Projects/town77 && pnpm test
```

---

## File Map

```
packages/client/src/
├── store/
│   └── gameStore.ts                  # MODIFY: add socket emit actions
├── hooks/
│   ├── useGameConnection.ts          # CREATE: socket lifecycle hook
│   └── useValidCells.ts             # CREATE: client-side validation hook
├── screens/
│   ├── ConfigScreen.tsx             # MODIFY: full implementation
│   ├── JoinScreen.tsx              # CREATE: room code entry form
│   ├── LobbyScreen.tsx             # MODIFY: full implementation
│   ├── GameScreen.tsx              # MODIFY: full implementation
│   └── ResultsScreen.tsx           # MODIFY: full implementation
├── components/
│   ├── ScoreTable.tsx              # CREATE: results score table
│   ├── Stepper.tsx                 # CREATE: numeric stepper control
│   ├── ThemeCard.tsx              # CREATE: theme picker card
│   └── Toast.tsx                  # CREATE: error toast notification
├── router.tsx                     # MODIFY: add /join route → JoinScreen
├── __tests__/
│   ├── screens/
│   │   ├── ConfigScreen.test.tsx
│   │   ├── JoinScreen.test.tsx
│   │   ├── LobbyScreen.test.tsx
│   │   ├── GameScreen.test.tsx
│   │   └── ResultsScreen.test.tsx
│   ├── hooks/
│   │   ├── useGameConnection.test.ts
│   │   └── useValidCells.test.ts
│   ├── ScoreTable.test.tsx
│   ├── Stepper.test.tsx
│   ├── ThemeCard.test.tsx
│   ├── Toast.test.tsx
│   └── store-emit.test.ts
```

---

## Wave 1: Store Socket Actions + Hooks

### Task 1: Add socket emit actions to gameStore (TDD)

**Files:**
- Modify: `packages/client/src/store/gameStore.ts`
- Create: `packages/client/src/__tests__/store-emit.test.ts`

- [ ] **Step 1.1: Write failing tests**

```typescript
// packages/client/src/__tests__/store-emit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGameStore } from '../store/gameStore'

// Mock socket
vi.mock('../lib/socket', () => {
  const emit = vi.fn()
  const connect = vi.fn()
  const disconnect = vi.fn()
  const on = vi.fn()
  const removeAllListeners = vi.fn()
  return {
    socket: { emit, connect, disconnect, on, removeAllListeners },
  }
})

import { socket } from '../lib/socket'

describe('gameStore emit actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useGameStore.setState({
      gameState: null,
      playerId: null,
      sessionToken: null,
      roomCode: null,
      selectedChip: null,
      lastError: null,
      scores: null,
      connected: false,
    })
  })

  it('createRoom emits create_room with config, themeId, playerName', () => {
    const { createRoom } = useGameStore.getState()
    const config = { grid: { rows: 7, cols: 7 }, chips: { colors: ['color-1'], shapes: ['cottage'], copies: 1 }, handSize: 4, scoring: { placedWeight: 1, remainingWeight: 1 }, exchange: { min: 3, max: 4 } }
    createRoom(config, 'town77', 'Alice')
    expect(socket.emit).toHaveBeenCalledWith('create_room', {
      config,
      themeId: 'town77',
      playerName: 'Alice',
    })
  })

  it('joinRoom emits join_room with code, playerName', () => {
    const { joinRoom } = useGameStore.getState()
    joinRoom('ABC123', 'Bob')
    expect(socket.emit).toHaveBeenCalledWith('join_room', {
      code: 'ABC123',
      playerName: 'Bob',
    })
  })

  it('joinRoom with sessionToken includes it', () => {
    const { joinRoom } = useGameStore.getState()
    joinRoom('ABC123', 'Bob', 'player-1', 'tok-123')
    expect(socket.emit).toHaveBeenCalledWith('join_room', {
      code: 'ABC123',
      playerName: 'Bob',
      playerId: 'player-1',
      sessionToken: 'tok-123',
    })
  })

  it('startGame emits start_game', () => {
    const { startGame } = useGameStore.getState()
    startGame()
    expect(socket.emit).toHaveBeenCalledWith('start_game')
  })

  it('placeChip emits place_chip with chip, row, col', () => {
    const { placeChip } = useGameStore.getState()
    const chip = { color: 'color-1', shape: 'cottage' }
    placeChip(chip, 3, 4)
    expect(socket.emit).toHaveBeenCalledWith('place_chip', {
      chip,
      row: 3,
      col: 4,
    })
  })

  it('exchangeChips emits exchange_chips with chips array', () => {
    const { exchangeChips } = useGameStore.getState()
    const chips = [{ color: 'color-1', shape: 'cottage' }]
    exchangeChips(chips)
    expect(socket.emit).toHaveBeenCalledWith('exchange_chips', { chips })
  })

  it('discardChip emits discard_chip with chip', () => {
    const { discardChip } = useGameStore.getState()
    const chip = { color: 'color-2', shape: 'tower' }
    discardChip(chip)
    expect(socket.emit).toHaveBeenCalledWith('discard_chip', { chip })
  })
})
```

- [ ] **Step 1.2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- src/__tests__/store-emit.test.ts
```

Expected: `createRoom is not a function` (or similar)

- [ ] **Step 1.3: Implement emit actions in gameStore**

Add to the `GameStore` interface and implementation:

```typescript
// Add to GameStore interface:
createRoom: (config: GameConfig, themeId: string, playerName: string) => void
joinRoom: (code: string, playerName: string, playerId?: string, sessionToken?: string) => void
startGame: () => void
placeChip: (chip: Chip, row: number, col: number) => void
exchangeChips: (chips: Chip[]) => void
discardChip: (chip: Chip) => void

// Add to implementation:
createRoom: (config, themeId, playerName) => {
  socket.emit('create_room', { config, themeId, playerName })
},
joinRoom: (code, playerName, playerId, sessionToken) => {
  const payload: JoinRoomPayload = { code, playerName }
  if (playerId) payload.playerId = playerId
  if (sessionToken) payload.sessionToken = sessionToken
  socket.emit('join_room', payload)
},
startGame: () => {
  socket.emit('start_game')
},
placeChip: (chip, row, col) => {
  socket.emit('place_chip', { chip, row, col })
},
exchangeChips: (chips) => {
  socket.emit('exchange_chips', { chips })
},
discardChip: (chip) => {
  socket.emit('discard_chip', { chip })
},
```

- [ ] **Step 1.4: Run — expect PASS** (store-emit + existing store tests)

- [ ] **Step 1.5: Commit**

```bash
git add packages/client/src/store/gameStore.ts packages/client/src/__tests__/store-emit.test.ts
git commit -m "feat(client): acciones de emisión socket en gameStore"
```

---

### Task 2: useGameConnection hook (TDD)

**Files:**
- Create: `packages/client/src/hooks/useGameConnection.ts`
- Create: `packages/client/src/__tests__/hooks/useGameConnection.test.ts`

- [ ] **Step 2.1: Write failing tests**

```typescript
// packages/client/src/__tests__/hooks/useGameConnection.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameStore } from '../store/gameStore'

const mockConnect = vi.fn()
const mockDisconnect = vi.fn()

vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(),
}))

// Simple mock — useGameConnection calls store.connect on mount, store.disconnect on unmount
import { useGameConnection } from '../hooks/useGameConnection'

describe('useGameConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useGameStore).mockImplementation((selector) => {
      const state = {
        connect: mockConnect,
        disconnect: mockDisconnect,
        connected: false,
        gameState: null,
        playerId: null,
        sessionToken: null,
        roomCode: null,
        selectedChip: null,
        lastError: null,
        scores: null,
      }
      return selector ? selector(state as any) : state
    })
  })

  it('calls store.connect on mount', () => {
    renderHook(() => useGameConnection())
    expect(mockConnect).toHaveBeenCalledTimes(1)
  })

  it('calls store.disconnect on unmount', () => {
    const { unmount } = renderHook(() => useGameConnection())
    unmount()
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  it('returns connected state from store', () => {
    vi.mocked(useGameStore).mockImplementation(() => ({
      connected: true,
      connect: mockConnect,
      disconnect: mockDisconnect,
    }))
    const { result } = renderHook(() => useGameConnection())
    expect(result.current.connected).toBe(true)
  })
})
```

- [ ] **Step 2.2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- src/__tests__/hooks/useGameConnection.test.ts
```

Expected: `Cannot find module '../hooks/useGameConnection'`

- [ ] **Step 2.3: Implement useGameConnection**

```typescript
// packages/client/src/hooks/useGameConnection.ts
import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export function useGameConnection() {
  const connect = useGameStore((s) => s.connect)
  const disconnect = useGameStore((s) => s.disconnect)
  const connected = useGameStore((s) => s.connected)

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return { connected }
}
```

- [ ] **Step 2.4: Run — expect PASS**

- [ ] **Step 2.5: Commit**

```bash
git add packages/client/src/hooks/
git commit -m "feat(client): hook useGameConnection — lifecycle de socket"
```

---

### Task 3: useValidCells hook (TDD)

**Files:**
- Create: `packages/client/src/hooks/useValidCells.ts`
- Create: `packages/client/src/__tests__/hooks/useValidCells.test.ts`

- [ ] **Step 3.1: Write failing tests**

```typescript
// packages/client/src/__tests__/hooks/useValidCells.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Grid, Chip } from '@town77/shared-types'
import { useValidCells } from '../hooks/useValidCells'

describe('useValidCells', () => {
  const emptyGrid: Grid = Array.from({ length: 7 }, () => Array(7).fill(null))
  const chip: Chip = { color: 'color-1', shape: 'cottage' }

  it('returns all cells when grid is empty (first chip can go anywhere)', () => {
    const { result } = renderHook(() => useValidCells(emptyGrid, chip))
    expect(result.current).toHaveLength(49)
  })

  it('returns empty array when no chip selected', () => {
    const { result } = renderHook(() => useValidCells(emptyGrid, null))
    expect(result.current).toHaveLength(0)
  })

  it('filters cells after a chip is placed', () => {
    const grid: Grid = Array.from({ length: 7 }, () => Array(7).fill(null))
    grid[3][3] = { color: 'color-1', shape: 'cottage' }
    const nextChip: Chip = { color: 'color-2', shape: 'tower' }
    const { result } = renderHook(() => useValidCells(grid, nextChip))
    // Should only include adjacent cells that pass row/column uniqueness
    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current.length).toBeLessThan(49)
    // Each returned cell should be a [row, col] tuple
    for (const [r, c] of result.current) {
      expect(r).toBeGreaterThanOrEqual(0)
      expect(c).toBeGreaterThanOrEqual(0)
    }
  })
})
```

- [ ] **Step 3.2: Run — expect FAIL**

- [ ] **Step 3.3: Implement useValidCells**

```typescript
// packages/client/src/hooks/useValidCells.ts
import { useMemo } from 'react'
import type { Chip, Grid } from '@town77/shared-types'
import { getValidCells } from '@town77/game-engine'

export function useValidCells(grid: Grid, selectedChip: Chip | null): [number, number][] {
  return useMemo(() => {
    if (!selectedChip) return []
    return getValidCells(grid, selectedChip)
  }, [grid, selectedChip])
}
```

- [ ] **Step 3.4: Run — expect PASS**

- [ ] **Step 3.5: Commit**

```bash
git add packages/client/src/hooks/useValidCells.ts packages/client/src/__tests__/hooks/useValidCells.test.ts
git commit -m "feat(client): hook useValidCells — validación cliente con game-engine"
```

---

## Wave 2: Reusable UI Components

### Task 4: Stepper component (TDD)

**Files:**
- Create: `packages/client/src/components/Stepper.tsx`
- Create: `packages/client/src/__tests__/Stepper.test.tsx`

- [ ] **Step 4.1: Write failing tests**

```tsx
// packages/client/src/__tests__/Stepper.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from './helpers'
import { Stepper } from '../components/Stepper'

describe('Stepper', () => {
  it('displays current value', () => {
    renderWithTheme(<Stepper label="Colors" value={5} min={1} max={7} onChange={() => {}} />)
    expect(screen.getByTestId('stepper-value')).toHaveTextContent('5')
  })

  it('displays label', () => {
    renderWithTheme(<Stepper label="Colors" value={5} min={1} max={7} onChange={() => {}} />)
    expect(screen.getByText('Colors')).toBeDefined()
  })

  it('calls onChange with value+1 on increment click', async () => {
    const onChange = vi.fn()
    renderWithTheme(<Stepper label="Colors" value={5} min={1} max={7} onChange={onChange} />)
    await userEvent.click(screen.getByTestId('stepper-inc'))
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it('calls onChange with value-1 on decrement click', async () => {
    const onChange = vi.fn()
    renderWithTheme(<Stepper label="Colors" value={5} min={1} max={7} onChange={onChange} />)
    await userEvent.click(screen.getByTestId('stepper-dec'))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('disables decrement at min', () => {
    renderWithTheme(<Stepper label="Colors" value={1} min={1} max={7} onChange={() => {}} />)
    expect(screen.getByTestId('stepper-dec')).toBeDisabled()
  })

  it('disables increment at max', () => {
    renderWithTheme(<Stepper label="Colors" value={7} min={1} max={7} onChange={() => {}} />)
    expect(screen.getByTestId('stepper-inc')).toBeDisabled()
  })
})
```

- [ ] **Step 4.2: Run — expect FAIL**

- [ ] **Step 4.3: Implement Stepper**

```tsx
// packages/client/src/components/Stepper.tsx
interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

const buttonStyle = {
  background: 'var(--color-surface-cell)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  fontSize: 'var(--text-lg)',
  fontWeight: 700,
  height: 36,
  width: 36,
}

export function Stepper({ label, value, min, max, onChange }: StepperProps) {
  return (
    <div data-testid="stepper" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', minWidth: 80 }}>
        {label}
      </span>
      <button
        type="button"
        data-testid="stepper-dec"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        style={{ ...buttonStyle, opacity: value <= min ? 0.4 : 1 }}
      >
        −
      </button>
      <span data-testid="stepper-value" style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-lg)', fontWeight: 700, minWidth: 32, textAlign: 'center' }}>
        {value}
      </span>
      <button
        type="button"
        data-testid="stepper-inc"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        style={{ ...buttonStyle, opacity: value >= max ? 0.4 : 1 }}
      >
        +
      </button>
    </div>
  )
}
```

- [ ] **Step 4.4: Run — expect PASS**

- [ ] **Step 4.5: Commit**

```bash
git add packages/client/src/components/Stepper.tsx packages/client/src/__tests__/Stepper.test.tsx
git commit -m "feat(client): componente Stepper para configuración de juego"
```

---

### Task 5: ThemeCard component (TDD)

**Files:**
- Create: `packages/client/src/components/ThemeCard.tsx`
- Create: `packages/client/src/__tests__/ThemeCard.test.tsx`

- [ ] **Step 5.1: Write failing tests**

```tsx
// packages/client/src/__tests__/ThemeCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from './helpers'
import { town77Theme } from '../themes/town77'
import { ThemeCard } from '../components/ThemeCard'

describe('ThemeCard', () => {
  it('renders theme name', () => {
    renderWithTheme(<ThemeCard theme={town77Theme} isSelected={false} onClick={() => {}} />)
    expect(screen.getByText(town77Theme.name)).toBeDefined()
  })

  it('sets data-selected when selected', () => {
    renderWithTheme(<ThemeCard theme={town77Theme} isSelected onClick={() => {}} />)
    expect(screen.getByTestId(`theme-card-${town77Theme.id}`)).toHaveAttribute('data-selected', 'true')
  })

  it('renders color swatches from palette', () => {
    renderWithTheme(<ThemeCard theme={town77Theme} isSelected={false} onClick={() => {}} />)
    const swatches = screen.getAllByTestId(/^theme-swatch-/)
    expect(swatches.length).toBe(7)
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    renderWithTheme(<ThemeCard theme={town77Theme} isSelected={false} onClick={onClick} />)
    await userEvent.click(screen.getByTestId(`theme-card-${town77Theme.id}`))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 5.2: Run — expect FAIL**

- [ ] **Step 5.3: Implement ThemeCard**

```tsx
// packages/client/src/components/ThemeCard.tsx
import type { Theme } from '@town77/shared-types'

interface ThemeCardProps {
  theme: Theme
  isSelected: boolean
  onClick: () => void
}

export function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  const colors = Object.values(theme.colorPalette)

  return (
    <button
      type="button"
      data-testid={`theme-card-${theme.id}`}
      data-selected={isSelected}
      onClick={onClick}
      style={{
        background: theme.surfaces.background,
        border: isSelected ? '2px solid var(--color-text-accent)' : '2px solid transparent',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
        padding: 'var(--space-sm)',
        textAlign: 'left',
      }}
    >
      <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
        {theme.name}
      </span>
      <div style={{ display: 'flex', gap: 2 }}>
        {colors.map((color, i) => (
          <div
            key={i}
            data-testid={`theme-swatch-${i}`}
            style={{
              background: color,
              borderRadius: 'var(--radius-sm)',
              flex: 1,
              height: 20,
            }}
          />
        ))}
      </div>
    </button>
  )
}
```

- [ ] **Step 5.4: Run — expect PASS**

- [ ] **Step 5.5: Commit**

```bash
git add packages/client/src/components/ThemeCard.tsx packages/client/src/__tests__/ThemeCard.test.tsx
git commit -m "feat(client): componente ThemeCard para selector de tema"
```

---

### Task 6: Toast component (TDD)

**Files:**
- Create: `packages/client/src/components/Toast.tsx`
- Create: `packages/client/src/__tests__/Toast.test.tsx`

- [ ] **Step 6.1: Write failing tests**

```tsx
// packages/client/src/__tests__/Toast.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from './helpers'
import { Toast } from '../components/Toast'

describe('Toast', () => {
  it('renders message text', () => {
    renderWithTheme(<Toast message="Something went wrong" onDismiss={() => {}} />)
    expect(screen.getByText('Something went wrong')).toBeDefined()
  })

  it('calls onDismiss when close button clicked', async () => {
    const onDismiss = vi.fn()
    renderWithTheme(<Toast message="Error" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByTestId('toast-dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when message is null', () => {
    const { container } = renderWithTheme(<Toast message={null} onDismiss={() => {}} />)
    expect(container.querySelector('[data-testid="toast"]')).toBeNull()
  })
})
```

- [ ] **Step 6.2: Run — expect FAIL**

- [ ] **Step 6.3: Implement Toast**

```tsx
// packages/client/src/components/Toast.tsx
interface ToastProps {
  message: string | null
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      data-testid="toast"
      style={{
        alignItems: 'center',
        background: 'var(--cell-bg-invalid)',
        borderRadius: 'var(--radius-md)',
        bottom: 'var(--space-lg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        gap: 'var(--space-sm)',
        left: '50%',
        maxWidth: 400,
        padding: 'var(--space-sm) var(--space-md)',
        position: 'fixed',
        transform: 'translateX(-50%)',
        zIndex: 100,
      }}
    >
      <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{message}</span>
      <button
        type="button"
        data-testid="toast-dismiss"
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontSize: 'var(--text-lg)',
        }}
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 6.4: Run — expect PASS**

- [ ] **Step 6.5: Commit**

```bash
git add packages/client/src/components/Toast.tsx packages/client/src/__tests__/Toast.test.tsx
git commit -m "feat(client): componente Toast para errores de servidor"
```

---

### Task 7: ScoreTable component (TDD)

**Files:**
- Create: `packages/client/src/components/ScoreTable.tsx`
- Create: `packages/client/src/__tests__/ScoreTable.test.tsx`

- [ ] **Step 7.1: Write failing tests**

```tsx
// packages/client/src/__tests__/ScoreTable.test.tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from './helpers'
import type { Score } from '@town77/shared-types'
import { ScoreTable } from '../components/ScoreTable'

const scores: Score[] = [
  { playerId: 'p1', name: 'Alice', placed: 10, remaining: 2, combined: 8 },
  { playerId: 'p2', name: 'Bob', placed: 8, remaining: 1, combined: 7 },
  { playerId: 'p3', name: 'Carol', placed: 6, remaining: 4, combined: 2 },
]

describe('ScoreTable', () => {
  it('renders all player names', () => {
    renderWithTheme(<ScoreTable scores={scores} />)
    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Bob')).toBeDefined()
    expect(screen.getByText('Carol')).toBeDefined()
  })

  it('renders placed, remaining, and combined for each player', () => {
    renderWithTheme(<ScoreTable scores={scores} />)
    // Alice: 10 placed, 2 remaining, 8 combined
    expect(screen.getByTestId('score-placed-p1')).toHaveTextContent('10')
    expect(screen.getByTestId('score-remaining-p1')).toHaveTextContent('2')
    expect(screen.getByTestId('score-combined-p1')).toHaveTextContent('8')
  })

  it('marks the combined winner with data-winner', () => {
    renderWithTheme(<ScoreTable scores={scores} />)
    expect(screen.getByTestId('score-row-p1')).toHaveAttribute('data-winner', 'true')
    expect(screen.getByTestId('score-row-p2')).toHaveAttribute('data-winner', 'false')
  })

  it('handles ties (multiple winners)', () => {
    const tied: Score[] = [
      { playerId: 'p1', name: 'Alice', placed: 10, remaining: 2, combined: 8 },
      { playerId: 'p2', name: 'Bob', placed: 10, remaining: 2, combined: 8 },
    ]
    renderWithTheme(<ScoreTable scores={tied} />)
    expect(screen.getByTestId('score-row-p1')).toHaveAttribute('data-winner', 'true')
    expect(screen.getByTestId('score-row-p2')).toHaveAttribute('data-winner', 'true')
  })
})
```

- [ ] **Step 7.2: Run — expect FAIL**

- [ ] **Step 7.3: Implement ScoreTable**

```tsx
// packages/client/src/components/ScoreTable.tsx
import { useTranslation } from 'react-i18next'
import type { Score } from '@town77/shared-types'

interface ScoreTableProps {
  scores: Score[]
}

export function ScoreTable({ scores }: ScoreTableProps) {
  const { t } = useTranslation('results')
  const maxCombined = Math.max(...scores.map((s) => s.combined))

  const headerStyle = {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    padding: 'var(--space-xs) var(--space-sm)',
    textAlign: 'left' as const,
  }

  const cellStyle = {
    padding: 'var(--space-xs) var(--space-sm)',
    fontSize: 'var(--text-base)',
  }

  return (
    <table
      data-testid="score-table"
      style={{
        borderCollapse: 'collapse',
        color: 'var(--color-text-primary)',
        width: '100%',
      }}
    >
      <thead>
        <tr>
          <th style={headerStyle} />
          <th style={headerStyle}>{t('placed')}</th>
          <th style={headerStyle}>{t('remaining')}</th>
          <th style={headerStyle}>{t('total')}</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((score) => {
          const isWinner = score.combined === maxCombined
          return (
            <tr
              key={score.playerId}
              data-testid={`score-row-${score.playerId}`}
              data-winner={isWinner}
              style={{
                background: isWinner ? 'var(--color-surface-cell-valid)' : 'transparent',
              }}
            >
              <td style={{ ...cellStyle, fontWeight: isWinner ? 700 : 400 }}>
                {score.name}
                {isWinner ? ' 👑' : ''}
              </td>
              <td data-testid={`score-placed-${score.playerId}`} style={cellStyle}>
                {score.placed}
              </td>
              <td data-testid={`score-remaining-${score.playerId}`} style={cellStyle}>
                {score.remaining}
              </td>
              <td data-testid={`score-combined-${score.playerId}`} style={{ ...cellStyle, fontWeight: 700 }}>
                {score.combined}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 7.4: Run — expect PASS**

- [ ] **Step 7.5: Commit**

```bash
git add packages/client/src/components/ScoreTable.tsx packages/client/src/__tests__/ScoreTable.test.tsx
git commit -m "feat(client): componente ScoreTable para pantalla de resultados"
```

---

## Wave 3: ConfigScreen + JoinScreen

### Task 8: ConfigScreen — config state and steppers (TDD)

**Files:**
- Modify: `packages/client/src/screens/ConfigScreen.tsx`
- Create: `packages/client/src/__tests__/screens/ConfigScreen.test.tsx`

- [ ] **Step 8.1: Write failing tests**

```tsx
// packages/client/src/__tests__/screens/ConfigScreen.test.tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../helpers'
import { ConfigScreen } from '../../screens/ConfigScreen'

describe('ConfigScreen', () => {
  it('renders with data-testid config-screen', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-screen')).toBeDefined()
  })

  it('shows grid size stepper defaulting to 7', () => {
    renderWithTheme(<ConfigScreen />)
    const gridStepper = screen.getByTestId('config-grid')
    expect(gridStepper).toBeDefined()
  })

  it('shows colors stepper defaulting to 7', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-colors')).toBeDefined()
  })

  it('shows shapes stepper defaulting to 7', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-shapes')).toBeDefined()
  })

  it('shows copies stepper defaulting to 1', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-copies')).toBeDefined()
  })

  it('shows hand size stepper defaulting to 4', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-hand-size')).toBeDefined()
  })

  it('displays total chips count', () => {
    renderWithTheme(<ConfigScreen />)
    // 7 colors × 7 shapes × 1 copy = 49
    expect(screen.getByTestId('config-total-chips')).toHaveTextContent('49')
  })

  it('displays board cells count', () => {
    renderWithTheme(<ConfigScreen />)
    // 7 × 7 = 49
    expect(screen.getByTestId('config-board-cells')).toHaveTextContent('49')
  })

  it('shows warning when chips < cells', async () => {
    renderWithTheme(<ConfigScreen />)
    // Set grid to 9x9 (81 cells) with 7 colors × 7 shapes × 1 copy (49 chips)
    const gridInc = screen.getByTestId('config-grid').querySelector('[data-testid="stepper-inc"]')!
    // Click twice: 7 → 8 → 9
    await userEvent.click(gridInc)
    await userEvent.click(gridInc)
    expect(screen.getByTestId('config-warning')).toBeDefined()
  })

  it('shows theme cards for available themes', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('theme-card-town77')).toBeDefined()
    expect(screen.getByTestId('theme-card-playful-pastel')).toBeDefined()
  })

  it('has a "Crear sala" button that is disabled by default (no player name)', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('btn-create-room')).toBeDisabled()
  })

  it('enables "Crear sala" when player name is entered', async () => {
    renderWithTheme(<ConfigScreen />)
    await userEvent.type(screen.getByTestId('input-player-name'), 'Alice')
    expect(screen.getByTestId('btn-create-room')).not.toBeDisabled()
  })

  it('shows quick preset buttons', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('preset-classic')).toBeDefined()
    expect(screen.getByTestId('preset-fast')).toBeDefined()
  })

  it('clicking "Fast 5x5" preset sets grid to 5', async () => {
    renderWithTheme(<ConfigScreen />)
    await userEvent.click(screen.getByTestId('preset-fast'))
    // Board cells should now be 25
    expect(screen.getByTestId('config-board-cells')).toHaveTextContent('25')
  })
})
```

- [ ] **Step 8.2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- src/__tests__/screens/ConfigScreen.test.tsx
```

- [ ] **Step 8.3: Implement ConfigScreen**

```tsx
// packages/client/src/screens/ConfigScreen.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import type { GameConfig } from '@town77/shared-types'
import { Stepper } from '../components/Stepper'
import { ThemeCard } from '../components/ThemeCard'
import { useGameStore } from '../store/gameStore'
import { THEMES, type ThemeId } from '../themes'

type Preset = 'classic' | 'fast' | 'custom'

export function ConfigScreen() {
  const { t } = useTranslation('config')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const createRoom = useGameStore((s) => s.createRoom)

  const [playerName, setPlayerName] = useState('')
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>('town77')
  const [gridSize, setGridSize] = useState(DEFAULT_GAME_CONFIG.grid.rows)
  const [colors, setColors] = useState(DEFAULT_GAME_CONFIG.chips.colors.length)
  const [shapes, setShapes] = useState(DEFAULT_GAME_CONFIG.chips.shapes.length)
  const [copies, setCopies] = useState(DEFAULT_GAME_CONFIG.chips.copies)
  const [handSize, setHandSize] = useState(DEFAULT_GAME_CONFIG.handSize)

  const totalChips = colors * shapes * copies
  const boardCells = gridSize * gridSize
  const showWarning = totalChips < boardCells
  const canCreate = playerName.trim().length > 0

  function applyPreset(preset: Preset) {
    if (preset === 'classic') {
      setGridSize(7); setColors(7); setShapes(7); setCopies(1); setHandSize(4)
    } else if (preset === 'fast') {
      setGridSize(5); setColors(5); setShapes(5); setCopies(1); setHandSize(4)
    }
  }

  function handleCreate() {
    if (!canCreate) return
    const config: GameConfig = {
      grid: { rows: gridSize, cols: gridSize },
      chips: {
        colors: Array.from({ length: colors }, (_, i) => `color-${i + 1}`),
        shapes: DEFAULT_GAME_CONFIG.chips.shapes.slice(0, shapes),
        copies,
      },
      handSize,
      scoring: DEFAULT_GAME_CONFIG.scoring,
      exchange: DEFAULT_GAME_CONFIG.exchange,
    }
    createRoom(config, selectedThemeId, playerName.trim())
    // Navigation happens when server responds with room_joined
  }

  return (
    <main
      data-testid="config-screen"
      style={{
        background: 'var(--color-surface-bg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        margin: '0 auto',
        maxWidth: 560,
        minHeight: '100vh',
        padding: 'var(--space-xl)',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', margin: 0 }}>
        {tc('create_room')}
      </h1>

      {/* Player name */}
      <input
        data-testid="input-player-name"
        placeholder={tc('join')}
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        style={{
          background: 'var(--color-surface-cell)',
          border: '1px solid var(--color-surface-cell-hover)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--text-base)',
          padding: 'var(--space-sm) var(--space-md)',
        }}
      />

      {/* Presets */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <button type="button" data-testid="preset-classic" onClick={() => applyPreset('classic')}
          style={{ background: 'var(--color-surface-cell)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', cursor: 'pointer', padding: 'var(--space-xs) var(--space-md)' }}>
          {t('preset_classic')}
        </button>
        <button type="button" data-testid="preset-fast" onClick={() => applyPreset('fast')}
          style={{ background: 'var(--color-surface-cell)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', cursor: 'pointer', padding: 'var(--space-xs) var(--space-md)' }}>
          {t('preset_fast')}
        </button>
      </div>

      {/* Theme picker */}
      <div style={{ display: 'grid', gap: 'var(--space-sm)', gridTemplateColumns: '1fr 1fr' }}>
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={theme.id === selectedThemeId}
            onClick={() => setSelectedThemeId(theme.id as ThemeId)}
          />
        ))}
      </div>

      {/* Steppers */}
      <div data-testid="config-grid"><Stepper label={t('grid_size')} value={gridSize} min={3} max={11} onChange={setGridSize} /></div>
      <div data-testid="config-colors"><Stepper label={t('colors')} value={colors} min={2} max={7} onChange={setColors} /></div>
      <div data-testid="config-shapes"><Stepper label={t('shapes')} value={shapes} min={2} max={7} onChange={setShapes} /></div>
      <div data-testid="config-copies"><Stepper label={t('copies')} value={copies} min={1} max={3} onChange={setCopies} /></div>
      <div data-testid="config-hand-size"><Stepper label={t('hand_size')} value={handSize} min={3} max={6} onChange={setHandSize} /></div>

      {/* Derived info */}
      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        <span data-testid="config-total-chips">{t('total_chips', { count: totalChips })}</span>
        <br />
        <span data-testid="config-board-cells">{t('board_cells', { count: boardCells })}</span>
      </div>

      {showWarning && (
        <div data-testid="config-warning" style={{ color: 'var(--color-text-accent)', fontSize: 'var(--text-sm)' }}>
          {t('warning_chips_lt_cells')}
        </div>
      )}

      {/* Create button */}
      <button
        type="button"
        data-testid="btn-create-room"
        disabled={!canCreate}
        onClick={handleCreate}
        style={{
          background: canCreate ? 'var(--color-text-accent)' : 'var(--color-surface-cell)',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-surface-bg)',
          cursor: canCreate ? 'pointer' : 'not-allowed',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          padding: 'var(--space-md) var(--space-xl)',
        }}
      >
        {tc('create_room')}
      </button>
    </main>
  )
}
```

- [ ] **Step 8.4: Run — expect PASS** (ConfigScreen + all existing tests)

- [ ] **Step 8.5: Commit**

```bash
git add packages/client/src/screens/ConfigScreen.tsx packages/client/src/__tests__/screens/ConfigScreen.test.tsx
git commit -m "feat(client): ConfigScreen — formulario de configuración con TDD"
```

---

### Task 9: JoinScreen (TDD)

**Files:**
- Create: `packages/client/src/screens/JoinScreen.tsx`
- Create: `packages/client/src/__tests__/screens/JoinScreen.test.tsx`
- Modify: `packages/client/src/router.tsx`

- [ ] **Step 9.1: Write failing tests**

```tsx
// packages/client/src/__tests__/screens/JoinScreen.test.tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../helpers'
import { JoinScreen } from '../../screens/JoinScreen'

describe('JoinScreen', () => {
  it('renders with data-testid join-screen', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('join-screen')).toBeDefined()
  })

  it('has player name input', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('input-join-name')).toBeDefined()
  })

  it('has room code input', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('input-room-code')).toBeDefined()
  })

  it('join button disabled when fields empty', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('btn-join-room')).toBeDisabled()
  })

  it('join button enabled when both fields filled', async () => {
    renderWithTheme(<JoinScreen />)
    await userEvent.type(screen.getByTestId('input-join-name'), 'Bob')
    await userEvent.type(screen.getByTestId('input-room-code'), 'ABC123')
    expect(screen.getByTestId('btn-join-room')).not.toBeDisabled()
  })

  it('has a back button', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('btn-back')).toBeDefined()
  })
})
```

- [ ] **Step 9.2: Run — expect FAIL**

- [ ] **Step 9.3: Implement JoinScreen**

```tsx
// packages/client/src/screens/JoinScreen.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function JoinScreen() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const joinRoom = useGameStore((s) => s.joinRoom)

  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')

  const canJoin = playerName.trim().length > 0 && roomCode.trim().length > 0

  function handleJoin() {
    if (!canJoin) return
    const code = roomCode.trim().toUpperCase()
    joinRoom(code, playerName.trim())
    navigate(`/room/${code}`)
  }

  const inputStyle = {
    background: 'var(--color-surface-cell)',
    border: '1px solid var(--color-surface-cell-hover)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--text-base)',
    padding: 'var(--space-sm) var(--space-md)',
    width: '100%',
  }

  return (
    <main
      data-testid="join-screen"
      style={{
        alignItems: 'center',
        background: 'var(--color-surface-bg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-xl)',
      }}
    >
      <button
        type="button"
        data-testid="btn-back"
        onClick={() => navigate('/')}
        style={{
          alignSelf: 'flex-start',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontSize: 'var(--text-base)',
        }}
      >
        ← {t('back')}
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', margin: 0 }}>
        {t('join')}
      </h1>

      <input
        data-testid="input-join-name"
        placeholder={t('join')}
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        style={inputStyle}
      />

      <input
        data-testid="input-room-code"
        placeholder="ABC123"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        maxLength={6}
        style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.2em', fontSize: 'var(--text-lg)', fontWeight: 700 }}
      />

      <button
        type="button"
        data-testid="btn-join-room"
        disabled={!canJoin}
        onClick={handleJoin}
        style={{
          background: canJoin ? 'var(--color-text-accent)' : 'var(--color-surface-cell)',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-surface-bg)',
          cursor: canJoin ? 'pointer' : 'not-allowed',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          padding: 'var(--space-md) var(--space-xl)',
        }}
      >
        {t('join')}
      </button>
    </main>
  )
}
```

- [ ] **Step 9.4: Update router to use JoinScreen for /join**

```tsx
// In packages/client/src/router.tsx, change:
// import { LobbyScreen } from "./screens/LobbyScreen" for /join
// Add: import { JoinScreen } from "./screens/JoinScreen"
// Change route: <Route path="/join" element={<JoinScreen />} />
```

- [ ] **Step 9.5: Run — expect PASS**

- [ ] **Step 9.6: Commit**

```bash
git add packages/client/src/screens/JoinScreen.tsx packages/client/src/__tests__/screens/JoinScreen.test.tsx packages/client/src/router.tsx
git commit -m "feat(client): JoinScreen — formulario para unirse a sala"
```

---

## Wave 4: LobbyScreen

### Task 10: LobbyScreen — full implementation (TDD)

**Files:**
- Modify: `packages/client/src/screens/LobbyScreen.tsx`
- Create: `packages/client/src/__tests__/screens/LobbyScreen.test.tsx`

- [ ] **Step 10.1: Write failing tests**

```tsx
// packages/client/src/__tests__/screens/LobbyScreen.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../helpers'
import { useGameStore } from '../../store/gameStore'
import { LobbyScreen } from '../../screens/LobbyScreen'

// Mock store with realistic state
vi.mock('../../store/gameStore')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useParams: () => ({ code: 'ABC123' }) }
})

const mockGameState = {
  grid: Array.from({ length: 7 }, () => Array(7).fill(null)),
  bag: [],
  players: [
    { id: 'p1', name: 'Alice', hand: [], placed: 0, hasDiscarded: false, connected: true },
    { id: 'p2', name: 'Bob', hand: [], placed: 0, hasDiscarded: false, connected: true },
  ],
  turnIndex: 0,
  phase: 'lobby' as const,
  config: { grid: { rows: 7, cols: 7 }, chips: { colors: ['color-1'], shapes: ['cottage'], copies: 1 }, handSize: 4, scoring: { placedWeight: 1, remainingWeight: 1 }, exchange: { min: 3, max: 4 } },
  themeId: 'town77',
  seed: 42,
}

describe('LobbyScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: mockGameState,
        playerId: 'p1',
        roomCode: 'ABC123',
        connected: true,
        startGame: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
      return selector ? selector(state as any) : state
    })
  })

  it('renders with data-testid lobby-screen', () => {
    renderWithTheme(<LobbyScreen />)
    expect(screen.getByTestId('lobby-screen')).toBeDefined()
  })

  it('displays the room code prominently', () => {
    renderWithTheme(<LobbyScreen />)
    expect(screen.getByTestId('room-code')).toHaveTextContent('ABC123')
  })

  it('has a copy code button', () => {
    renderWithTheme(<LobbyScreen />)
    expect(screen.getByTestId('btn-copy-code')).toBeDefined()
  })

  it('renders player badges for all players', () => {
    renderWithTheme(<LobbyScreen />)
    expect(screen.getByTestId('player-badge-p1')).toBeDefined()
    expect(screen.getByTestId('player-badge-p2')).toBeDefined()
  })

  it('shows "Start game" button when host and 2+ players', () => {
    renderWithTheme(<LobbyScreen />)
    expect(screen.getByTestId('btn-start-game')).toBeDefined()
    expect(screen.getByTestId('btn-start-game')).not.toBeDisabled()
  })

  it('hides "Start game" when not host (player is not first)', () => {
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: mockGameState,
        playerId: 'p2', // not first player = not host
        roomCode: 'ABC123',
        connected: true,
        startGame: vi.fn(),
      }
      return selector ? selector(state as any) : state
    })
    renderWithTheme(<LobbyScreen />)
    expect(screen.queryByTestId('btn-start-game')).toBeNull()
  })

  it('disables "Start game" when only 1 player', () => {
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: { ...mockGameState, players: [mockGameState.players[0]] },
        playerId: 'p1',
        roomCode: 'ABC123',
        connected: true,
        startGame: vi.fn(),
      }
      return selector ? selector(state as any) : state
    })
    renderWithTheme(<LobbyScreen />)
    expect(screen.getByTestId('btn-start-game')).toBeDisabled()
  })

  it('calls startGame on button click', async () => {
    const startGame = vi.fn()
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: mockGameState,
        playerId: 'p1',
        roomCode: 'ABC123',
        connected: true,
        startGame,
      }
      return selector ? selector(state as any) : state
    })
    renderWithTheme(<LobbyScreen />)
    await userEvent.click(screen.getByTestId('btn-start-game'))
    expect(startGame).toHaveBeenCalledTimes(1)
  })

  it('shows config summary', () => {
    renderWithTheme(<LobbyScreen />)
    expect(screen.getByTestId('lobby-config-summary')).toBeDefined()
  })
})
```

- [ ] **Step 10.2: Run — expect FAIL**

- [ ] **Step 10.3: Implement LobbyScreen**

```tsx
// packages/client/src/screens/LobbyScreen.tsx
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { PlayerBadge } from '../components/PlayerBadge'
import { useGameConnection } from '../hooks/useGameConnection'
import { useGameStore } from '../store/gameStore'

export function LobbyScreen() {
  const { t } = useTranslation('game')
  const { t: tc } = useTranslation('common')
  const { code: routeCode } = useParams<{ code: string }>()

  const { connected } = useGameConnection()
  const gameState = useGameStore((s) => s.gameState)
  const playerId = useGameStore((s) => s.playerId)
  const roomCode = useGameStore((s) => s.roomCode) ?? routeCode
  const startGame = useGameStore((s) => s.startGame)

  if (!gameState || !playerId) {
    return (
      <main data-testid="lobby-screen" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {tc('connecting')}
      </main>
    )
  }

  const isHost = gameState.players[0]?.id === playerId
  const canStart = isHost && gameState.players.length >= 2

  async function handleCopyCode() {
    if (roomCode && navigator.clipboard) {
      await navigator.clipboard.writeText(roomCode)
    }
  }

  return (
    <main
      data-testid="lobby-screen"
      style={{
        alignItems: 'center',
        background: 'var(--color-surface-bg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        minHeight: '100vh',
        padding: 'var(--space-xl)',
      }}
    >
      {/* Room code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <span
          data-testid="room-code"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-display)',
            fontWeight: 700,
            letterSpacing: '0.15em',
          }}
        >
          {roomCode}
        </span>
        <button
          type="button"
          data-testid="btn-copy-code"
          onClick={handleCopyCode}
          style={{
            background: 'var(--color-surface-cell)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            padding: 'var(--space-xs) var(--space-sm)',
          }}
        >
          {tc('copy_code')}
        </button>
      </div>

      {/* Connection status */}
      <span style={{ color: connected ? 'var(--color-surface-cell-valid)' : 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        {connected ? tc('connected') : tc('connecting')}
      </span>

      {/* Player list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%', maxWidth: 400 }}>
        {gameState.players.map((player, index) => (
          <PlayerBadge
            key={player.id}
            player={player}
            isCurrentTurn={index === gameState.turnIndex}
            isMyPlayer={player.id === playerId}
          />
        ))}
      </div>

      {/* Config summary */}
      <div
        data-testid="lobby-config-summary"
        style={{
          background: 'var(--color-surface-grid)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          padding: 'var(--space-sm) var(--space-md)',
        }}
      >
        {gameState.config.grid.rows}×{gameState.config.grid.cols} · {gameState.config.chips.colors.length} colors · {gameState.config.chips.shapes.length} shapes
      </div>

      {/* Start button (host only) */}
      {isHost && (
        <button
          type="button"
          data-testid="btn-start-game"
          disabled={!canStart}
          onClick={startGame}
          style={{
            background: canStart ? 'var(--color-text-accent)' : 'var(--color-surface-cell)',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-surface-bg)',
            cursor: canStart ? 'pointer' : 'not-allowed',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            padding: 'var(--space-md) var(--space-xl)',
          }}
        >
          {t('start_game')}
        </button>
      )}
    </main>
  )
}
```

- [ ] **Step 10.4: Run — expect PASS**

- [ ] **Step 10.5: Commit**

```bash
git add packages/client/src/screens/LobbyScreen.tsx packages/client/src/__tests__/screens/LobbyScreen.test.tsx
git commit -m "feat(client): LobbyScreen — sala de espera con lista de jugadores"
```

---

## Wave 5: GameScreen

### Task 11: GameScreen — layout and state display (TDD)

**Files:**
- Modify: `packages/client/src/screens/GameScreen.tsx`
- Create: `packages/client/src/__tests__/screens/GameScreen.test.tsx`

- [ ] **Step 11.1: Write failing tests (Part 1 — layout)**

```tsx
// packages/client/src/__tests__/screens/GameScreen.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../helpers'
import { useGameStore } from '../../store/gameStore'
import { GameScreen } from '../../screens/GameScreen'

vi.mock('../../store/gameStore')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useParams: () => ({ code: 'ABC123' }), useNavigate: () => vi.fn() }
})

const mockChip = { color: 'color-1', shape: 'cottage' }
const mockGameState = {
  grid: Array.from({ length: 7 }, () => Array(7).fill(null)),
  bag: [{ color: 'color-2', shape: 'tower' }, { color: 'color-3', shape: 'barn' }],
  players: [
    { id: 'p1', name: 'Alice', hand: [mockChip, { color: 'color-2', shape: 'tower' }, { color: 'color-3', shape: 'barn' }, { color: 'color-4', shape: 'victorian' }], placed: 0, hasDiscarded: false, connected: true },
    { id: 'p2', name: 'Bob', hand: [{ color: 'color-5', shape: 'rowhouse' }], placed: 0, hasDiscarded: false, connected: true },
  ],
  turnIndex: 0,
  phase: 'playing' as const,
  config: { grid: { rows: 7, cols: 7 }, chips: { colors: ['color-1','color-2','color-3','color-4','color-5'], shapes: ['cottage','tower','barn','victorian','rowhouse'], copies: 1 }, handSize: 4, scoring: { placedWeight: 1, remainingWeight: 1 }, exchange: { min: 3, max: 4 } },
  themeId: 'town77',
  seed: 42,
}

describe('GameScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: mockGameState,
        playerId: 'p1',
        roomCode: 'ABC123',
        connected: true,
        selectedChip: null,
        lastError: null,
        selectChip: vi.fn(),
        placeChip: vi.fn(),
        exchangeChips: vi.fn(),
        discardChip: vi.fn(),
        clearError: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
      return selector ? selector(state as any) : state
    })
  })

  it('renders the grid component', () => {
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('grid')).toBeDefined()
  })

  it('renders the hand component with player chips', () => {
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('hand')).toBeDefined()
  })

  it('shows player badges in top bar', () => {
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('player-badge-p1')).toBeDefined()
    expect(screen.getByTestId('player-badge-p2')).toBeDefined()
  })

  it('shows bag count', () => {
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('bag-count')).toHaveTextContent('2')
  })

  it('shows turn indicator when it is my turn', () => {
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('turn-indicator')).toHaveTextContent('your_turn')
  })

  it('shows waiting text when it is not my turn', () => {
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: { ...mockGameState, turnIndex: 1 }, // Bob's turn
        playerId: 'p1',
        roomCode: 'ABC123',
        connected: true,
        selectedChip: null,
        lastError: null,
        selectChip: vi.fn(),
        placeChip: vi.fn(),
        exchangeChips: vi.fn(),
        discardChip: vi.fn(),
        clearError: vi.fn(),
      }
      return selector ? selector(state as any) : state
    })
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('turn-indicator')).toHaveTextContent('waiting')
  })

  it('renders action bar with exchange and discard', () => {
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('action-bar')).toBeDefined()
    expect(screen.getByTestId('btn-exchange')).toBeDefined()
    expect(screen.getByTestId('btn-discard')).toBeDefined()
  })
})
```

- [ ] **Step 11.2: Run — expect FAIL**

- [ ] **Step 11.3: Implement GameScreen layout**

```tsx
// packages/client/src/screens/GameScreen.tsx
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ActionBar } from '../components/ActionBar'
import { Grid } from '../components/Grid'
import { Hand } from '../components/Hand'
import { PlayerBadge } from '../components/PlayerBadge'
import { Toast } from '../components/Toast'
import { useGameConnection } from '../hooks/useGameConnection'
import { useValidCells } from '../hooks/useValidCells'
import { useGameStore } from '../store/gameStore'

export function GameScreen() {
  const { t } = useTranslation('game')
  const navigate = useNavigate()

  const { connected } = useGameConnection()
  const gameState = useGameStore((s) => s.gameState)
  const playerId = useGameStore((s) => s.playerId)
  const selectedChip = useGameStore((s) => s.selectedChip)
  const lastError = useGameStore((s) => s.lastError)
  const selectChip = useGameStore((s) => s.selectChip)
  const placeChip = useGameStore((s) => s.placeChip)
  const exchangeChips = useGameStore((s) => s.exchangeChips)
  const discardChip = useGameStore((s) => s.discardChip)
  const clearError = useGameStore((s) => s.clearError)

  if (!gameState || !playerId) {
    return (
      <main data-testid="game-screen" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {t('waiting')}
      </main>
    )
  }

  const myPlayer = gameState.players.find((p) => p.id === playerId)
  const isMyTurn = gameState.players[gameState.turnIndex]?.id === playerId
  const validCells = useValidCells(gameState.grid, selectedChip)

  function handleCellClick(row: number, col: number) {
    if (!selectedChip || !isMyTurn) return
    placeChip(selectedChip, row, col)
    selectChip(null)
  }

  function handleExchange() {
    if (!myPlayer) return
    // Simple: exchange all selected chips (future: selection UI)
    // For now, this is a placeholder that sends empty — server will reject
    exchangeChips([])
  }

  function handleDiscard() {
    if (!selectedChip || !myPlayer) return
    discardChip(selectedChip)
    selectChip(null)
  }

  const canExchange = isMyTurn && myPlayer !== undefined && myPlayer.hand.length >= gameState.config.exchange.min
  const canDiscard = isMyTurn && myPlayer !== undefined && !myPlayer.hasDiscarded && selectedChip !== null

  return (
    <main
      data-testid="game-screen"
      style={{
        background: 'var(--color-surface-bg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Top bar: player badges + bag count */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', flexWrap: 'wrap' }}>
        {gameState.players.map((player, index) => (
          <PlayerBadge
            key={player.id}
            player={player}
            isCurrentTurn={index === gameState.turnIndex}
            isMyPlayer={player.id === playerId}
            size="sm"
            variant="compact"
          />
        ))}
        <span data-testid="bag-count" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginLeft: 'auto' }}>
          {gameState.bag.length}
        </span>
      </header>

      {/* Turn indicator */}
      <div
        data-testid="turn-indicator"
        style={{
          color: isMyTurn ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
          fontSize: 'var(--text-base)',
          fontWeight: isMyTurn ? 700 : 400,
          padding: 'var(--space-xs) var(--space-md)',
          textAlign: 'center',
        }}
      >
        {isMyTurn ? t('your_turn') : t('waiting')}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-sm)' }}>
        <Grid
          grid={gameState.grid}
          validCells={validCells}
          onCellClick={isMyTurn ? handleCellClick : undefined}
        />
      </div>

      {/* Hand */}
      <div style={{ padding: 'var(--space-sm) var(--space-md)' }}>
        <Hand
          chips={myPlayer?.hand ?? []}
          selectedChip={selectedChip}
          onSelect={isMyTurn ? selectChip : () => {}}
        />
      </div>

      {/* Action bar */}
      <ActionBar
        canExchange={canExchange}
        canDiscard={canDiscard}
        onExchange={handleExchange}
        onDiscard={handleDiscard}
      />

      {/* Error toast */}
      {lastError && (
        <Toast
          message={t(lastError.messageKey, { ns: 'errors' })}
          onDismiss={clearError}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 11.4: Run — expect PASS**

- [ ] **Step 11.5: Commit**

```bash
git add packages/client/src/screens/GameScreen.tsx packages/client/src/__tests__/screens/GameScreen.test.tsx
git commit -m "feat(client): GameScreen — tablero, mano, badges y acciones"
```

---

### Task 12: GameScreen — navigation on game_over (TDD)

**Files:**
- Modify: `packages/client/src/screens/GameScreen.tsx`
- Extend: `packages/client/src/__tests__/screens/GameScreen.test.tsx`

- [ ] **Step 12.1: Write failing test**

```tsx
// Add to GameScreen.test.tsx
it('navigates to results when game phase becomes finished', () => {
  const navigate = vi.fn()
  vi.mocked(useGameStore).mockImplementation((selector: any) => {
    const state = {
      gameState: { ...mockGameState, phase: 'finished' },
      playerId: 'p1',
      roomCode: 'ABC123',
      connected: true,
      selectedChip: null,
      lastError: null,
      selectChip: vi.fn(),
      placeChip: vi.fn(),
      exchangeChips: vi.fn(),
      discardChip: vi.fn(),
      clearError: vi.fn(),
    }
    return selector ? selector(state as any) : state
  })

  // Override useNavigate mock
  vi.doMock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useParams: () => ({ code: 'ABC123' }), useNavigate: () => navigate }
  })

  renderWithTheme(<GameScreen />)
  // After render with phase=finished, should redirect
  // (Implementation uses useEffect to watch phase changes)
})
```

- [ ] **Step 12.2: Implement useEffect navigation in GameScreen**

Add to GameScreen component:

```typescript
import { useEffect } from 'react'

// Inside the component, after the early return:
useEffect(() => {
  if (gameState.phase === 'finished') {
    navigate(`/results/${roomCode ?? ''}`)
  }
}, [gameState.phase, navigate, roomCode])
```

- [ ] **Step 12.3: Run — expect PASS**

- [ ] **Step 12.4: Commit**

```bash
git commit -m "feat(client): GameScreen — navegación automática a resultados"
```

---

## Wave 6: ResultsScreen

### Task 13: ResultsScreen — full implementation (TDD)

**Files:**
- Modify: `packages/client/src/screens/ResultsScreen.tsx`
- Create: `packages/client/src/__tests__/screens/ResultsScreen.test.tsx`

- [ ] **Step 13.1: Write failing tests**

```tsx
// packages/client/src/__tests__/screens/ResultsScreen.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../helpers'
import { useGameStore } from '../../store/gameStore'
import { ResultsScreen } from '../../screens/ResultsScreen'

vi.mock('../../store/gameStore')

const mockScores = [
  { playerId: 'p1', name: 'Alice', placed: 10, remaining: 2, combined: 8 },
  { playerId: 'p2', name: 'Bob', placed: 8, remaining: 1, combined: 7 },
]

describe('ResultsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        scores: mockScores,
        roomCode: 'ABC123',
        disconnect: vi.fn(),
      }
      return selector ? selector(state as any) : state
    })
  })

  it('renders with data-testid results-screen', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('results-screen')).toBeDefined()
  })

  it('shows "Winner" heading', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('results-title')).toBeDefined()
  })

  it('renders the score table', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('score-table')).toBeDefined()
  })

  it('has "Play again" button', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('btn-play-again')).toBeDefined()
  })

  it('has "New room" button', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('btn-new-room')).toBeDefined()
  })

  it('announces the winner name', () => {
    renderWithTheme(<ResultsScreen />)
    // Alice has highest combined (8)
    expect(screen.getByTestId('results-winner-name')).toHaveTextContent('Alice')
  })
})
```

- [ ] **Step 13.2: Run — expect FAIL**

- [ ] **Step 13.3: Implement ResultsScreen**

```tsx
// packages/client/src/screens/ResultsScreen.tsx
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ScoreTable } from '../components/ScoreTable'
import { useGameStore } from '../store/gameStore'

export function ResultsScreen() {
  const { t } = useTranslation('results')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const scores = useGameStore((s) => s.scores)
  const disconnect = useGameStore((s) => s.disconnect)

  if (!scores || scores.length === 0) {
    return (
      <main data-testid="results-screen" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {t('tied')}
      </main>
    )
  }

  const maxCombined = Math.max(...scores.map((s) => s.combined))
  const winners = scores.filter((s) => s.combined === maxCombined)
  const winnerText = winners.map((w) => w.name).join(', ')

  function handlePlayAgain() {
    navigate('/')
  }

  function handleNewRoom() {
    disconnect()
    navigate('/')
  }

  return (
    <main
      data-testid="results-screen"
      style={{
        alignItems: 'center',
        background: 'var(--color-surface-bg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        minHeight: '100vh',
        padding: 'var(--space-xl)',
      }}
    >
      <h1 data-testid="results-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', margin: 0 }}>
        {t('winner')}
      </h1>

      <div data-testid="results-winner-name" style={{ color: 'var(--color-text-accent)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
        {winners.length === scores.length ? t('tied') : winnerText} 👑
      </div>

      <div style={{ maxWidth: 480, width: '100%' }}>
        <ScoreTable scores={scores} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <button
          type="button"
          data-testid="btn-play-again"
          onClick={handlePlayAgain}
          style={{
            background: 'var(--color-text-accent)',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-surface-bg)',
            cursor: 'pointer',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            padding: 'var(--space-md) var(--space-xl)',
          }}
        >
          {t('play_again')}
        </button>
        <button
          type="button"
          data-testid="btn-new-room"
          onClick={handleNewRoom}
          style={{
            background: 'var(--color-surface-cell)',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontSize: 'var(--text-base)',
            padding: 'var(--space-md) var(--space-xl)',
          }}
        >
          {t('new_room')}
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 13.4: Run — expect PASS**

- [ ] **Step 13.5: Commit**

```bash
git add packages/client/src/screens/ResultsScreen.tsx packages/client/src/__tests__/screens/ResultsScreen.test.tsx
git commit -m "feat(client): ResultsScreen — tabla de puntuaciones y ganador"
```

---

## Wave 7: Navigation Guards + Session Recovery

### Task 14: Navigation guard — redirect when not in game (TDD)

**Files:**
- Create: `packages/client/src/hooks/useRequireGame.ts`
- Modify: `packages/client/src/screens/GameScreen.tsx`
- Create: `packages/client/src/__tests__/hooks/useRequireGame.test.ts`

- [ ] **Step 14.1: Write failing tests**

```typescript
// packages/client/src/__tests__/hooks/useRequireGame.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGameStore } from '../../store/gameStore'

vi.mock('../../store/gameStore')
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

import { useRequireGame } from '../../hooks/useRequireGame'

describe('useRequireGame', () => {
  it('does not redirect when gameState exists', () => {
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = { gameState: { phase: 'playing' }, roomCode: 'ABC' }
      return selector ? selector(state as any) : state
    })
    renderHook(() => useRequireGame())
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('redirects to / when gameState is null', () => {
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = { gameState: null, roomCode: null }
      return selector ? selector(state as any) : state
    })
    renderHook(() => useRequireGame())
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
```

- [ ] **Step 14.2: Run — expect FAIL**

- [ ] **Step 14.3: Implement useRequireGame**

```typescript
// packages/client/src/hooks/useRequireGame.ts
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function useRequireGame() {
  const navigate = useNavigate()
  const gameState = useGameStore((s) => s.gameState)

  useEffect(() => {
    if (!gameState) {
      navigate('/')
    }
  }, [gameState, navigate])
}
```

- [ ] **Step 14.4: Run — expect PASS**

- [ ] **Step 14.5: Wire into GameScreen (add `useRequireGame()` call at top)**

- [ ] **Step 14.6: Commit**

```bash
git add packages/client/src/hooks/useRequireGame.ts packages/client/src/__tests__/hooks/useRequireGame.test.ts
git commit -m "feat(client): guardia de navegación useRequireGame"
```

---

### Task 15: Session recovery from localStorage (TDD)

**Files:**
- Modify: `packages/client/src/screens/LobbyScreen.tsx`
- Create: `packages/client/src/__tests__/screens/session-recovery.test.tsx`

- [ ] **Step 15.1: Write failing test**

```tsx
// packages/client/src/__tests__/screens/session-recovery.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithTheme } from '../helpers'
import { useGameStore } from '../../store/gameStore'

vi.mock('../../store/gameStore')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useParams: () => ({ code: 'ABC123' }) }
})

import { LobbyScreen } from '../../screens/LobbyScreen'

describe('Session recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('auto-joins with stored session token when navigating to /room/:code with no gameState', () => {
    const joinRoom = vi.fn()
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: null,
        playerId: null,
        roomCode: null,
        connected: true,
        joinRoom,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
      return selector ? selector(state as any) : state
    })

    // Simulate stored session
    localStorage.setItem('sessionToken', 'tok-abc')
    localStorage.setItem('playerId', 'p1')
    localStorage.setItem('playerName', 'Alice')

    renderWithTheme(<LobbyScreen />)

    // Should auto-emit join_room with stored token
    expect(joinRoom).toHaveBeenCalledWith('ABC123', 'Alice', 'p1', 'tok-abc')
  })

  it('shows connecting state when no stored session and no gameState', () => {
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: null,
        playerId: null,
        roomCode: null,
        connected: true,
        joinRoom: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
      return selector ? selector(state as any) : state
    })

    const { container } = renderWithTheme(<LobbyScreen />)
    expect(container.textContent).toContain('Conectando')
  })
})
```

- [ ] **Step 15.2: Run — expect FAIL**

- [ ] **Step 15.3: Implement session recovery in LobbyScreen**

Add a `useEffect` to LobbyScreen that checks for stored session data when `gameState` is null:

```typescript
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

// Inside LobbyScreen component:
const joinRoom = useGameStore((s) => s.joinRoom)
const { code: routeCode } = useParams<{ code: string }>()

useEffect(() => {
  if (gameState) return // already connected
  const token = localStorage.getItem('sessionToken')
  const storedPlayerId = localStorage.getItem('playerId')
  const storedName = localStorage.getItem('playerName')
  if (token && storedPlayerId && storedName && routeCode) {
    joinRoom(routeCode, storedName, storedPlayerId, token)
  }
}, [gameState, joinRoom, routeCode])
```

Also add `playerName` to `persistSession` in gameStore (extend to save name):

```typescript
// In gameStore.ts persistSession:
localStorage.setItem('playerName', playerName) // add to room_joined handler
```

- [ ] **Step 15.4: Run — expect PASS**

- [ ] **Step 15.5: Commit**

```bash
git commit -m "feat(client): recuperación de sesión desde localStorage"
```

---

## Wave 8: Verification + Documentation Closeout

### Task 16: Full verification pass

- [ ] **Step 16.1: Run full test suite**

```bash
cd /Users/danieltibaquira/Projects/town77 && pnpm test
```

Expected: All tests pass (Phase 3 + 3.5 + Phase 4).

- [ ] **Step 16.2: Run typecheck**

```bash
cd packages/client && pnpm typecheck
```

Expected: No TypeScript errors.

- [ ] **Step 16.3: Run build**

```bash
cd packages/client && pnpm build
```

Expected: Build succeeds, `dist/` produced.

- [ ] **Step 16.4: Verify no hardcoded colors in new code**

Scan new/modified files for `#[0-9a-fA-F]{3,6}` — should only appear in tokens.css and theme files.

- [ ] **Step 16.5: Commit any fixes**

```bash
git commit -m "fix(client): Phase 4 verification fixes"
```

---

### Task 17: Documentation closeout

- [ ] **Step 17.1: Commit final state**

```bash
git add -A
git commit -m "docs: Phase 4 completa — pantallas del cliente implementadas"
```

---

## Phase 4 Complete

At this point:

| Area | Delivered |
|------|-----------|
| Store | Socket emit actions (createRoom, joinRoom, startGame, placeChip, exchangeChips, discardChip) |
| Hooks | useGameConnection, useValidCells, useRequireGame |
| Components | Stepper, ThemeCard, Toast, ScoreTable |
| ConfigScreen | Full game config form, theme picker, presets, validation |
| JoinScreen | Name + room code entry, navigation |
| LobbyScreen | Room code display, player list, start button, session recovery |
| GameScreen | Grid + Hand + PlayerBadges + ActionBar + turn indicator + error toast + auto-nav to results |
| ResultsScreen | Score table, winner announcement, play again / new room |
| Navigation | Guards, session recovery from localStorage |
| i18n | All screens use `t()` — no hardcoded strings |
| Tests | ~60-80 new tests across screens, hooks, and components |

**Explicitly NOT delivered (Phase 5+):**
- Drag-and-drop chip placement (click-to-select used instead)
- Exchange chip selection UI (multi-select 3-4 chips)
- Sound bank / Howler.js integration
- Celebrate particle effects on gameplay events
- Storybook stories for new components
- E2E Playwright tests
- Runtime theme JSON loading
- Disconnect countdown timer UI
- Nginx production config

**Next:** Phase 5 — Polish & E2E (to be written)

---

## Execution Order (Waves)

```
Wave 1 (Tasks 1-3): Store emit actions + hooks
  └─ foundation for all screens

Wave 2 (Tasks 4-7): Reusable UI components
  └─ Stepper, ThemeCard, Toast, ScoreTable

Wave 3 (Tasks 8-9): ConfigScreen + JoinScreen
  └─ room creation and joining flows

Wave 4 (Task 10): LobbyScreen
  └─ waiting room with player management

Wave 5 (Tasks 11-12): GameScreen
  └─ core gameplay screen

Wave 6 (Task 13): ResultsScreen
  └─ post-game scores

Wave 7 (Tasks 14-15): Navigation guards + session recovery
  └─ robustness and reconnection

Wave 8 (Tasks 16-17): Verification + docs
  └─ final QA and closeout
```

---

## Risk Notes

1. **Socket mocking in tests** — Screen tests need to mock the Zustand store heavily. Use `vi.mock('../../store/gameStore')` pattern consistently. The store tests use `vi.mock('../lib/socket')` for socket-level mocking.

2. **game-engine in jsdom** — `useValidCells` calls `getValidCells` from `@town77/game-engine`. This is pure TypeScript and works in jsdom. No issues expected.

3. **Navigation in tests** — `react-router-dom` needs mocking for `useNavigate` and `useParams`. Use `MemoryRouter` in renderWithTheme helper if possible, or mock the hooks directly.

4. **i18n in tests** — The existing `renderWithTheme` helper may not include `I18nextProvider`. Screen tests need it. Extend the helper or wrap individually.

5. **Clipboard API** — `navigator.clipboard` may not exist in jsdom. The copy code button should check for availability. Consider using `document.execCommand('copy')` as fallback or just test that the click handler doesn't throw.

6. **Phase 3.5 backward compatibility** — All existing component tests must stay green. New screen tests don't import components directly (they render screens that compose components).
