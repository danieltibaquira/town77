import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockConnect = vi.fn()
const mockDisconnect = vi.fn()

vi.mock('../../store/gameStore', () => {
  return {
    useGameStore: vi.fn((selector?: any) => {
      const state = {
        connect: mockConnect,
        disconnect: mockDisconnect,
        connected: false,
      }
      return selector ? selector(state) : state
    }),
  }
})

import { useGameConnection } from '../../hooks/useGameConnection'

describe('useGameConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    const { result } = renderHook(() => useGameConnection())
    expect(result.current.connected).toBe(false)
  })
})
