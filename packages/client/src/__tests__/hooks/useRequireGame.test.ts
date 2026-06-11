import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../store/gameStore', () => {
  return {
    useGameStore: vi.fn((selector?: any) => {
      // Default: no game state
      const state = { gameState: null, roomCode: null }
      return selector ? selector(state) : state
    }),
  }
})

import { useRequireGame } from '../../hooks/useRequireGame'
import { useGameStore } from '../../store/gameStore'

describe('useRequireGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to / when gameState is null', () => {
    renderHook(() => useRequireGame())
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('does not redirect when gameState exists', () => {
    vi.mocked(useGameStore).mockImplementation((selector: any) => {
      const state = { gameState: { phase: 'playing' }, roomCode: 'ABC' }
      return selector ? selector(state) : state
    })
    renderHook(() => useRequireGame())
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
