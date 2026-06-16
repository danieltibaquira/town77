/**
 * TDD regression test for P0#2 (fix-tracker.md → Wave 1).
 *
 * The bug: GameScreen.tsx calls `useValidCells(grid, chip)` AFTER an early
 * return when `!gameState || !playerId`. When the SAME component instance
 * re-renders across the null→populated transition, React detects a hook count
 * mismatch and logs:
 *
 *   "Warning: React has detected a change in the order of Hooks called by
 *    GameScreen. This will lead to bugs and errors if not fixed."
 *
 * The existing GameScreen.test.tsx never exercises the loading state, so the
 * bug ships silently. This test does, by mounting once and then forcing a
 * re-render via a stateful wrapper that swaps the mocked store mid-flight.
 *
 * RED : the second test should fail (console.error called with the hook warning).
 * GREEN: GameScreen.tsx moves the hook above the early return; test passes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useState } from 'react'
import { render, cleanup, screen, act } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../../lib/i18n'
import { ThemeContext } from '../../lib/theme'
import { getThemeById } from '../../themes'

// Mock the store BEFORE importing the screen, so vi.mocked() works.
vi.mock('../../store/gameStore')
vi.mock('../../hooks/useGameConnection', () => ({
  useGameConnection: () => ({ connected: true }),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useParams: () => ({ code: 'ABC123' }), useNavigate: () => vi.fn() }
})

import { useGameStore } from '../../store/gameStore'
import { GameScreen } from '../../screens/GameScreen'

const mockChip = { color: 'color-1', shape: 'cottage' }
const populatedGameState = {
  grid: Array.from({ length: 7 }, () => Array(7).fill(null)),
  bag: [{ color: 'color-2', shape: 'tower' }],
  players: [
    { id: 'p1', name: 'Alice', hand: [mockChip], placed: 0, hasDiscarded: false, connected: true },
  ],
  turnIndex: 0,
  phase: 'playing' as const,
  config: {
    grid: { rows: 7, cols: 7 },
    chips: { colors: ['color-1'], shapes: ['cottage'], copies: 1 },
    handSize: 4,
    scoring: { placedWeight: 1, remainingWeight: 1 },
    exchange: { min: 3, max: 4 },
  },
  themeId: 'town77',
  seed: 42,
}

function makeStoreState(gameState: typeof populatedGameState | null, playerId: string | null) {
  return {
    gameState,
    playerId,
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
}

/**
 * Stateful harness: starts with gameState=null, then on `setReady(true)` swaps
 * the mock to return a populated gameState. Forcing the parent to re-render
 * causes the child GameScreen to re-render with the new store state — same
 * fiber, different hook count if the bug exists.
 */
function Harness() {
  const [ready, setReady] = useState(false)
  const state = makeStoreState(ready ? populatedGameState : null, ready ? 'p1' : null)
  vi.mocked(useGameStore).mockImplementation((selector: any) => {
    return selector ? selector(state as any) : (state as any)
  })
  return (
    <div>
      <button data-testid="trigger-ready" onClick={() => setReady(true)}>
        go
      </button>
      <GameScreen />
    </div>
  )
}

function renderHarness() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <ThemeContext.Provider value={{ theme: getThemeById('town77'), setTheme: () => {} }}>
          <Harness />
        </ThemeContext.Provider>
      </I18nextProvider>
    </MemoryRouter>,
  )
}

function collectHookWarnings(errorSpy: ReturnType<typeof vi.spyOn>): string[] {
  return errorSpy.mock.calls
    .map((args) => String(args[0] ?? ''))
    .filter((msg) => msg.includes('order of Hooks') || msg.includes('Rendered fewer') || msg.includes('Rendered more'))
}

describe('GameScreen — Rules of Hooks (P0#2)', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error so the test runner output stays clean, while we
    // inspect the calls to detect React's hook-order warning.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
    cleanup()
  })

  it('renders the loading state when gameState is null', () => {
    renderHarness()
    // game-screen test id is rendered in the loading branch
    expect(screen.getByTestId('game-screen')).toBeDefined()
    expect(collectHookWarnings(errorSpy)).toEqual([])
  })

  it('does not warn about hook order when transitioning null → populated in the same instance', () => {
    renderHarness()
    // Sanity: no warnings on the initial loading render
    expect(collectHookWarnings(errorSpy)).toEqual([])

    // Trigger the transition. If GameScreen calls useValidCells after the early
    // return, React sees the hook count go from N (no useValidCells) to N+1
    // (useValidCells called) on the same fiber and logs a warning.
    act(() => {
      screen.getByTestId('trigger-ready').click()
    })

    const warnings = collectHookWarnings(errorSpy)
    expect(warnings).toEqual([])
  })

  it('renders the populated state without hook-order warnings on direct mount', () => {
    // Control case: mounting straight into the populated state should also be
    // clean. If this fails, the issue is not the transition but the steady state.
    function DirectHarness() {
      const state = makeStoreState(populatedGameState, 'p1')
      vi.mocked(useGameStore).mockImplementation((selector: any) => {
        return selector ? selector(state as any) : (state as any)
      })
      return <GameScreen />
    }

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <ThemeContext.Provider value={{ theme: getThemeById('town77'), setTheme: () => {} }}>
            <DirectHarness />
          </ThemeContext.Provider>
        </I18nextProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('grid')).toBeDefined()
    expect(collectHookWarnings(errorSpy)).toEqual([])
  })
})
