import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

let connected = false
const joinRoom = vi.fn()

vi.mock('../../store/gameStore', () => ({
  useGameStore: (selector: (state: unknown) => unknown) =>
    selector({ connected, gameState: null, joinRoom }),
}))

import { useRoomRecovery } from '../../hooks/useRoomRecovery'

describe('useRoomRecovery', () => {
  it('waits for a socket connection before recovering a matching saved room', () => {
    localStorage.setItem('roomCode', 'ABC123')
    localStorage.setItem('playerId', 'player-1')
    localStorage.setItem('playerName', 'Alice')
    localStorage.setItem('sessionToken', 'token-1')

    const { rerender } = renderHook(() => useRoomRecovery('ABC123'))
    expect(joinRoom).not.toHaveBeenCalled()

    connected = true
    rerender()
    expect(joinRoom).toHaveBeenCalledWith('ABC123', 'Alice', 'player-1', 'token-1')
  })
})
