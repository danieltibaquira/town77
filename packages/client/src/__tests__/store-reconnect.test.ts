import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGameStore } from '../store/gameStore'

// Mock socket — capture event handlers registered via socket.on(...)
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

function handlerFor(event: string): (() => void) | undefined {
  const call = (socket.on as unknown as { mock: { calls: unknown[][] } }).mock.calls.find(
    (c) => c[0] === event,
  )
  return call?.[1] as (() => void) | undefined
}

describe('gameStore reconnect rejoin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
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

  it('re-emits join_room on socket reconnect when a session is active', () => {
    // Established session (state populated after an initial room_joined).
    useGameStore.setState({ roomCode: 'ROOM01', sessionToken: 'tok-xyz', playerId: 'player-9' })
    localStorage.setItem('playerName', 'Alice')

    useGameStore.getState().connect()
    const onConnect = handlerFor('connect')
    expect(onConnect).toBeDefined()

    // Simulate the transport reconnecting (socket.io fires 'connect' again).
    onConnect!()

    expect(socket.emit).toHaveBeenCalledWith(
      'join_room',
      expect.objectContaining({
        code: 'ROOM01',
        playerId: 'player-9',
        sessionToken: 'tok-xyz',
      }),
    )
  })

  it('does NOT emit join_room on first connect when there is no active session', () => {
    useGameStore.getState().connect()
    const onConnect = handlerFor('connect')
    onConnect!()

    expect(socket.emit).not.toHaveBeenCalledWith('join_room', expect.anything())
  })
})
