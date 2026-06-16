import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createGrid } from '@town77/game-engine'

// P1#5: solo handlers had no error handling. A DB failure must not crash the
// worker (createSoloRoom) or leak an unhandled rejection from the setTimeout
// bot turn (runBotTurn).
vi.mock('../db/rooms', () => ({
  createRoom: vi.fn(() => {
    throw new Error('db fail')
  }),
  updateRoomState: vi.fn(() => {
    throw new Error('db fail')
  }),
  getRoom: vi.fn(),
}))
vi.mock('../db/players', () => ({ createPlayer: vi.fn() }))

import { createSoloRoomHandler } from '../handlers/create-solo-room'
import { runBotTurn } from '../handlers/solo-game'
import { getRoom } from '../db/rooms'

const mockGetRoom = getRoom as unknown as ReturnType<typeof vi.fn>

const io = { to: vi.fn(() => ({ emit: vi.fn() })) }

describe('create_solo_room — DB failure handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not throw and emits INTERNAL_ERROR when persistence fails', () => {
    const socket = { data: undefined, emit: vi.fn(), join: vi.fn() }
    const handler = createSoloRoomHandler(io as never, socket as never, {} as never)
    expect(() =>
      handler({ config: DEFAULT_GAME_CONFIG, themeId: 'town77', playerName: 'Alice' } as never),
    ).not.toThrow()
    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'INTERNAL_ERROR',
      messageKey: 'errors.internal',
    })
  })
})

describe('runBotTurn — DB failure handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not throw when updateRoomState fails mid bot turn', () => {
    const state = {
      grid: createGrid(7, 7),
      bag: [],
      players: [
        {
          id: 'bot-XYZ',
          name: 'Bot',
          hand: [{ color: 'color-1', shape: 'cottage' }],
          placed: 0,
          hasDiscarded: false,
          connected: true,
        },
      ],
      turnIndex: 0,
      phase: 'playing',
      config: DEFAULT_GAME_CONFIG,
      themeId: 'town77',
      seed: 1,
    }
    // runBotTurn re-reads state from the DB; return a bot-turn state so it
    // reaches the (throwing) updateRoomState and must catch it.
    mockGetRoom.mockReturnValue({ state_json: JSON.stringify(state) })
    // Empty grid -> bot places first chip -> updateRoomState throws -> must catch
    expect(() => runBotTurn(io as never, {} as never, 'CODE', state as never)).not.toThrow()
  })
})
