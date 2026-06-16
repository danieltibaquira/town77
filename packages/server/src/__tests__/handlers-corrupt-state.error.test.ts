import { describe, it, expect, vi, beforeEach } from 'vitest'

// P1#4: the P0#4/#5 try/catch was only applied to create-room/join-room. The
// other mutating handlers still parse state_json and write to the DB bare, so
// corrupt state (or a DB write error) throws an unhandled exception inside the
// socket callback. Feeding malformed state_json exercises the JSON.parse vector
// with minimal setup.
vi.mock('../db/rooms', () => ({
  getRoom: vi.fn(() => ({ state_json: '{ this is not valid json' })),
  updateRoomState: vi.fn(),
}))

import { placeChipHandler } from '../handlers/place-chip'
import { discardChipHandler } from '../handlers/discard-chip'
import { exchangeChipsHandler } from '../handlers/exchange-chips'
import { startGameHandler } from '../handlers/start-game'

function makeSocket() {
  return { data: { playerId: 'p1', roomCode: 'ABC123' }, emit: vi.fn() }
}

const io = { to: vi.fn(() => ({ emit: vi.fn() })) }

const cases = [
  ['place-chip', placeChipHandler, { chip: { color: 'color-1', shape: 'cottage' }, row: 0, col: 0 }],
  ['discard-chip', discardChipHandler, { chip: { color: 'color-1', shape: 'cottage' } }],
  ['exchange-chips', exchangeChipsHandler, { chips: [{ color: 'color-1', shape: 'cottage' }] }],
  ['start-game', startGameHandler, undefined],
] as const

describe('mutating handlers — corrupt state_json handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  for (const [name, factory, payload] of cases) {
    it(`${name}: does not throw on corrupt state`, () => {
      const socket = makeSocket()
      const handler = factory(io as never, socket as never, {} as never)
      expect(() => handler(payload as never)).not.toThrow()
    })

    it(`${name}: emits a graceful INTERNAL_ERROR on corrupt state`, () => {
      const socket = makeSocket()
      const handler = factory(io as never, socket as never, {} as never)
      handler(payload as never)
      expect(socket.emit).toHaveBeenCalledWith('error', {
        code: 'INTERNAL_ERROR',
        messageKey: 'errors.internal',
      })
    })
  }
})
