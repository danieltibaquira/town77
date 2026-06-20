import { describe, it, expect } from 'vitest'
import { generateRoomCode } from '../room/code'
import { generateSessionToken, generatePlayerId } from '../room/session'

describe('generateRoomCode', () => {
  it('returns a 6-character string', () => {
    expect(generateRoomCode()).toHaveLength(6)
  })

  it('uses only unambiguous characters (no I, O, 0, 1)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode()
      expect(code).not.toMatch(/[IO01]/)
    }
  })

  it('returns only uppercase alphanumeric', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateRoomCode()).toMatch(/^[A-Z2-9]{6}$/)
    }
  })

  it('generates unique codes (200 samples, no collision)', () => {
    const codes = new Set(Array.from({ length: 200 }, generateRoomCode))
    expect(codes.size).toBe(200)
  })
})

describe('generateSessionToken', () => {
  it('returns 64-character hex string', () => {
    const token = generateSessionToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 50 }, generateSessionToken))
    expect(tokens.size).toBe(50)
  })
})

describe('generatePlayerId', () => {
  it('returns 32-character hex string', () => {
    const id = generatePlayerId()
    expect(id).toHaveLength(32)
    expect(id).toMatch(/^[0-9a-f]{32}$/)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, generatePlayerId))
    expect(ids.size).toBe(50)
  })
})
