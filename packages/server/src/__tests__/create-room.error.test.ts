import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'

// P0#4: a failing DB write must not crash the handler with an unhandled
// exception — it must emit a graceful INTERNAL_ERROR to the client.
vi.mock('../db/rooms', () => ({
  createRoom: vi.fn(() => {
    throw new Error('db write failed')
  }),
}))
vi.mock('../db/players', () => ({
  createPlayer: vi.fn(),
}))

import { createRoomHandler } from '../handlers/create-room'

function makeSocket() {
  return { data: undefined, emit: vi.fn(), join: vi.fn() }
}

const payload = {
  config: DEFAULT_GAME_CONFIG,
  themeId: 'town77',
  playerName: 'Alice',
}

describe('create_room — DB failure handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not throw when room persistence fails', () => {
    const socket = makeSocket()
    const handler = createRoomHandler({} as never, socket as never, {} as never)
    expect(() => handler(payload as never)).not.toThrow()
  })

  it('emits a graceful INTERNAL_ERROR when room persistence fails', () => {
    const socket = makeSocket()
    const handler = createRoomHandler({} as never, socket as never, {} as never)
    handler(payload as never)
    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'INTERNAL_ERROR',
      messageKey: 'errors.internal',
    })
  })

  it('does not emit room_joined when room persistence fails', () => {
    const socket = makeSocket()
    const handler = createRoomHandler({} as never, socket as never, {} as never)
    handler(payload as never)
    expect(socket.emit).not.toHaveBeenCalledWith('room_joined', expect.anything())
  })
})
