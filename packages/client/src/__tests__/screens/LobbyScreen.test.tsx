import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { renderWithTheme } from '../helpers'

vi.mock('../../store/gameStore')
vi.mock('../../hooks/useGameConnection', () => ({
  useGameConnection: () => ({ connected: true }),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useParams: () => ({ code: 'ABC123' }) }
})

import { LobbyScreen } from '../../screens/LobbyScreen'

const mockGameState = {
  grid: Array.from({ length: 7 }, () => Array(7).fill(null)),
  bag: [],
  players: [
    { id: 'p1', name: 'Alice', hand: [], placed: 0, hasDiscarded: false, connected: true },
    { id: 'p2', name: 'Bob', hand: [], placed: 0, hasDiscarded: false, connected: true },
  ],
  turnIndex: 0,
  phase: 'lobby' as const,
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

  it('hides "Start game" when not host', () => {
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = {
        gameState: mockGameState,
        playerId: 'p2',
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
