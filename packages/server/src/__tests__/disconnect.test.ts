import { describe, it, expect, vi, beforeEach } from 'vitest'

// P1#7: disconnect must mark the player connected:false and broadcast the
// updated state (lifecycle event), not just log.
vi.mock('../db/rooms', () => ({
  getRoom: vi.fn(() => ({
    state_json: JSON.stringify({
      players: [
        { id: 'p1', connected: true, hand: [] },
        { id: 'p2', connected: true, hand: [] },
      ],
    }),
  })),
  updateRoomState: vi.fn(),
}))

import { disconnectHandler } from '../handlers/disconnect'
import { updateRoomState } from '../db/rooms'

describe('disconnect handler', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks the disconnecting player connected:false and broadcasts state_update', () => {
    const emit = vi.fn()
    const io = {
      sockets: {
        adapter: { rooms: new Map([['ABC', new Set(['s2'])]]) },
        sockets: new Map([['s2', { data: { playerId: 'p2' }, emit }]]),
      },
    }
    const socket = { id: 's1', data: { playerId: 'p1', roomCode: 'ABC' } }

    disconnectHandler(io as never, socket as never, {} as never)()

    const persisted = (updateRoomState as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!
    const state = persisted[2]
    expect(state.players.find((p: { id: string }) => p.id === 'p1').connected).toBe(false)
    expect(state.players.find((p: { id: string }) => p.id === 'p2').connected).toBe(true)
    expect(emit).toHaveBeenCalledWith(
      'state_update',
      expect.objectContaining({
        state: expect.objectContaining({
          players: expect.arrayContaining([expect.objectContaining({ id: 'p1', connected: false })]),
        }),
      }),
    )
  })

  it('no-ops when the socket has no room/player data', () => {
    const io = { sockets: { adapter: { rooms: new Map() }, sockets: new Map() } }
    const socket = { id: 's1', data: {} }
    expect(() =>
      disconnectHandler(io as never, socket as never, {} as never)(),
    ).not.toThrow()
    expect(updateRoomState).not.toHaveBeenCalled()
  })
})
