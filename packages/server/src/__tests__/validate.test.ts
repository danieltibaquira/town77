import { describe, it, expect } from 'vitest'
import { validatePlayerName, MAX_PLAYER_NAME_LENGTH } from '../room/validate'

// P1#8: playerName arrives untrusted off the socket and is written to the DB
// and broadcast to every player. It must be trimmed, non-empty, and length
// capped before use.
describe('validatePlayerName', () => {
  it('returns the trimmed name for valid input', () => {
    expect(validatePlayerName('  Alice  ')).toBe('Alice')
  })

  it('rejects empty or whitespace-only names', () => {
    expect(validatePlayerName('')).toBeNull()
    expect(validatePlayerName('   ')).toBeNull()
  })

  it('rejects names longer than the max length', () => {
    expect(validatePlayerName('a'.repeat(MAX_PLAYER_NAME_LENGTH + 1))).toBeNull()
  })

  it('accepts a name exactly at the max length', () => {
    const name = 'a'.repeat(MAX_PLAYER_NAME_LENGTH)
    expect(validatePlayerName(name)).toBe(name)
  })

  it('rejects non-string input', () => {
    expect(validatePlayerName(undefined as never)).toBeNull()
    expect(validatePlayerName(42 as never)).toBeNull()
  })
})
