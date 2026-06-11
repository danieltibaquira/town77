import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { renderWithTheme } from '../helpers'

vi.mock('../../store/gameStore')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

import { ResultsScreen } from '../../screens/ResultsScreen'

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

  it('shows Winner heading', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('results-title')).toBeDefined()
  })

  it('renders the score table', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('score-table')).toBeDefined()
  })

  it('has Play again button', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('btn-play-again')).toBeDefined()
  })

  it('has New room button', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('btn-new-room')).toBeDefined()
  })

  it('announces the winner name', () => {
    renderWithTheme(<ResultsScreen />)
    expect(screen.getByTestId('results-winner-name')).toHaveTextContent('Alice')
  })
})
