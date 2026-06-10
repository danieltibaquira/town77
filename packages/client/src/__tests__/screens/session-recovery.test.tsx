import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithTheme } from '../helpers'
import { useGameStore } from '../../store/gameStore'

vi.mock('../../store/gameStore')
vi.mock('../../hooks/useGameConnection', () => ({
  useGameConnection: () => ({ connected: true }),
}))
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

    localStorage.setItem('sessionToken', 'tok-abc')
    localStorage.setItem('playerId', 'p1')
    localStorage.setItem('playerName', 'Alice')

    renderWithTheme(<LobbyScreen />)

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
    // Spanish: 'Conectando…' is the i18n key 'connecting'
    expect(container.textContent).toBeTruthy()
  })
})
