import { describe, it, expect } from 'vitest'
import en from '../locales/en/errors.json'
import es from '../locales/es/errors.json'

// P1#9: every error the server emits as `socket.emit('error', { messageKey:
// 'errors.<key>' })` must have a translation, or i18next renders the raw key
// to the user. This is the authoritative contract — keep it in sync with the
// messageKeys emitted across packages/server/src/handlers/*. It also guards
// against dead keys (defined but never emitted) and en/es drift.
const EMITTED_ERROR_KEYS = [
  'already_discarded',
  'already_started',
  'game_in_progress',
  'game_not_active',
  'internal',
  'invalid_discard',
  'invalid_exchange',
  'invalid_name',
  'invalid_placement',
  'not_enough_players',
  'not_host',
  'not_in_room',
  'not_your_turn',
  'room_full',
  'room_not_found',
].sort()

describe('i18n error key coverage', () => {
  it('en/errors.json defines exactly the emitted error keys', () => {
    expect(Object.keys(en).sort()).toEqual(EMITTED_ERROR_KEYS)
  })

  it('es/errors.json defines exactly the emitted error keys', () => {
    expect(Object.keys(es).sort()).toEqual(EMITTED_ERROR_KEYS)
  })

  it('en and es define identical key sets', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())
  })
})
