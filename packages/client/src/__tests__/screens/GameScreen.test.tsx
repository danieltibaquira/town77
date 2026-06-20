import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '../helpers'
import { useGameStore } from '../../store/gameStore'

vi.mock('../../store/gameStore')
vi.mock('../../hooks/useGameConnection', () => ({
  useGameConnection: () => ({ connected: true }),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useParams: () => ({ code: 'ABC123' }), useNavigate: () => vi.fn() }
})

import { GameScreen } from '../../screens/GameScreen'

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
    expect(screen.getByTestId('turn-indicator')).toHaveTextContent('Tu turno')
  })

  it('shows waiting text when not my turn', () => {
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: { ...mockGameState, turnIndex: 1 },
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
    expect(screen.getByTestId('turn-indicator')).toHaveTextContent('Esperando')
  })

  it('renders action bar with exchange and discard', () => {
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('action-bar')).toBeDefined()
  })
})
