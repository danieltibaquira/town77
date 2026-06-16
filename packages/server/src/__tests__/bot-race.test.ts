import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createGrid } from '@town77/game-engine'

// P1#6: the bot turn is scheduled via setTimeout with a captured state
// snapshot. If a human moves (or the room changes) during the delay, the bot
// must act on the CURRENT DB state, not the stale snapshot. runBotTurn must
// re-read the room and bail when it is no longer the bot's turn.
vi.mock('../db/rooms', () => ({
  getRoom: vi.fn(),
  updateRoomState: vi.fn(),
}))

import { runBotTurn } from '../handlers/solo-game'
import { getRoom, updateRoomState } from '../db/rooms'

const mockGetRoom = getRoom as unknown as ReturnType<typeof vi.fn>

function stateJson(turnIndex: number, players: unknown[]) {
  return {
    state_json: JSON.stringify({
      grid: createGrid(7, 7),
      bag: [],
      players,
      turnIndex,
      phase: 'playing',
      config: DEFAULT_GAME_CONFIG,
      themeId: 'town77',
      seed: 1,
    }),
  }
}

const io = { to: vi.fn(() => ({ emit: vi.fn() })) }

describe('runBotTurn — stale snapshot race', () => {
  beforeEach(() => vi.clearAllMocks())

  it('re-reads DB and bails when the current turn is no longer the bot', () => {
    // Fresh DB state: it is the HUMAN's turn (index 0)
    mockGetRoom.mockReturnValue(
      stateJson(0, [
        { id: 'human', name: 'H', hand: [], placed: 0, hasDiscarded: false, connected: true },
        { id: 'bot-X', name: 'Bot', hand: [{ color: 'color-1', shape: 'cottage' }], placed: 0, hasDiscarded: false, connected: true },
      ]),
    )
    // Caller passes a STALE snapshot that claims it is the bot's turn (index 1)
    const staleSnapshot = {
      grid: createGrid(7, 7),
      bag: [],
      players: [
        { id: 'human', name: 'H', hand: [], placed: 0, hasDiscarded: false, connected: true },
        { id: 'bot-X', name: 'Bot', hand: [{ color: 'color-1', shape: 'cottage' }], placed: 0, hasDiscarded: false, connected: true },
      ],
      turnIndex: 1,
      phase: 'playing',
      config: DEFAULT_GAME_CONFIG,
      themeId: 'town77',
      seed: 1,
    }

    runBotTurn(io as never, {} as never, 'CODE', staleSnapshot as never)

    expect(mockGetRoom).toHaveBeenCalledWith({}, 'CODE')
    expect(updateRoomState).not.toHaveBeenCalled()
  })

  it('acts when the fresh DB state confirms it is the bot turn', () => {
    mockGetRoom.mockReturnValue(
      stateJson(0, [
        { id: 'bot-X', name: 'Bot', hand: [{ color: 'color-1', shape: 'cottage' }], placed: 0, hasDiscarded: false, connected: true },
        { id: 'human', name: 'H', hand: [], placed: 0, hasDiscarded: false, connected: true },
      ]),
    )

    runBotTurn(io as never, {} as never, 'CODE', { turnIndex: 0 } as never)

    expect(updateRoomState).toHaveBeenCalled()
  })
})
