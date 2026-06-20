import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'

// P1#8: handlers must reject invalid player names before any DB write.
vi.mock('../db/rooms', () => ({ createRoom: vi.fn() }))
vi.mock('../db/players', () => ({ createPlayer: vi.fn() }))

import { createRoomHandler } from '../handlers/create-room'
import { createRoom } from '../db/rooms'

function makeSocket() {
  return { data: undefined, emit: vi.fn(), join: vi.fn() }
}

describe('create_room — playerName validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects a whitespace-only name with VALIDATION_ERROR and no DB write', () => {
    const socket = makeSocket()
    const handler = createRoomHandler({} as never, socket as never, {} as never)
    handler({ config: DEFAULT_GAME_CONFIG, themeId: 'town77', playerName: '   ' } as never)
    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'VALIDATION_ERROR',
      messageKey: 'errors.invalid_name',
    })
    expect(createRoom).not.toHaveBeenCalled()
  })

  it('rejects an over-long name', () => {
    const socket = makeSocket()
    const handler = createRoomHandler({} as never, socket as never, {} as never)
    handler({
      config: DEFAULT_GAME_CONFIG,
      themeId: 'town77',
      playerName: 'a'.repeat(33),
    } as never)
    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'VALIDATION_ERROR',
      messageKey: 'errors.invalid_name',
    })
    expect(createRoom).not.toHaveBeenCalled()
  })

  it('accepts and trims a valid name', () => {
    const socket = makeSocket()
    const handler = createRoomHandler({} as never, socket as never, {} as never)
    handler({ config: DEFAULT_GAME_CONFIG, themeId: 'town77', playerName: '  Alice  ' } as never)
    expect(createRoom).toHaveBeenCalledTimes(1)
    // emitted room_joined with the trimmed name in state
    const roomJoined = socket.emit.mock.calls.find((c) => c[0] === 'room_joined')
    expect(roomJoined?.[1].state.players[0].name).toBe('Alice')
  })
})
