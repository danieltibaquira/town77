import { describe, it, expect, vi, beforeEach } from 'vitest'

// P0#5: a failing DB write while joining must not crash the handler — it must
// emit a graceful INTERNAL_ERROR to the client.
vi.mock('../db/rooms', () => ({
  getRoom: vi.fn(() => ({
    state_json: JSON.stringify({
      phase: 'lobby',
      players: [],
      config: { maxPlayers: 5 },
    }),
  })),
  updateRoomState: vi.fn(() => {
    throw new Error('db write failed')
  }),
}))
vi.mock('../db/players', () => ({
  createPlayer: vi.fn(),
  getPlayerByToken: vi.fn(),
}))

import { joinRoomHandler } from '../handlers/join-room'

function makeSocket() {
  return { data: undefined, emit: vi.fn(), join: vi.fn(), to: vi.fn(() => ({ emit: vi.fn() })) }
}

const payload = { code: 'ABC123', playerName: 'Bob' }

describe('join_room — DB failure handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not throw when join persistence fails', () => {
    const socket = makeSocket()
    const handler = joinRoomHandler({} as never, socket as never, {} as never)
    expect(() => handler(payload as never)).not.toThrow()
  })

  it('emits a graceful INTERNAL_ERROR when join persistence fails', () => {
    const socket = makeSocket()
    const handler = joinRoomHandler({} as never, socket as never, {} as never)
    handler(payload as never)
    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'INTERNAL_ERROR',
      messageKey: 'errors.internal',
    })
  })

  it('does not emit room_joined when join persistence fails', () => {
    const socket = makeSocket()
    const handler = joinRoomHandler({} as never, socket as never, {} as never)
    handler(payload as never)
    expect(socket.emit).not.toHaveBeenCalledWith('room_joined', expect.anything())
  })
})
