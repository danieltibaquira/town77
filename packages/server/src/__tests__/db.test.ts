import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import type { GameState } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createGrid } from '@town77/game-engine'
import { applyMigrations } from '../db/client'
import { createRoom, getRoom, updateRoomState } from '../db/rooms'
import { createPlayer, getPlayerByToken, getPlayersByRoom } from '../db/players'

function makeState(): GameState {
  return {
    grid: createGrid(7, 7),
    bag: [],
    players: [],
    turnIndex: 0,
    phase: 'lobby',
    config: DEFAULT_GAME_CONFIG,
    themeId: 'town77',
    seed: 42,
  }
}

describe('DB migrations', () => {
  it('creates rooms and players tables without error', () => {
    const db = new Database(':memory:')
    expect(() => applyMigrations(db)).not.toThrow()
    db.close()
  })

  it('is idempotent — running twice does not throw', () => {
    const db = new Database(':memory:')
    applyMigrations(db)
    expect(() => applyMigrations(db)).not.toThrow()
    db.close()
  })
})

describe('rooms', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    applyMigrations(db)
  })

  afterEach(() => db.close())

  it('createRoom + getRoom round-trips correctly', () => {
    const state = makeState()
    createRoom(db, { code: 'ABC123', themeId: 'town77', config: DEFAULT_GAME_CONFIG, state, seed: 42 })
    const row = getRoom(db, 'ABC123')
    expect(row).toBeDefined()
    expect(row!.code).toBe('ABC123')
    expect(row!.theme_id).toBe('town77')
    expect(row!.seed).toBe(42)
    const parsed = JSON.parse(row!.state_json) as GameState
    expect(parsed.phase).toBe('lobby')
  })

  it('getRoom returns undefined for missing code', () => {
    expect(getRoom(db, 'XXXXXX')).toBeUndefined()
  })

  it('updateRoomState persists new state', () => {
    const state = makeState()
    createRoom(db, { code: 'ABC123', themeId: 'town77', config: DEFAULT_GAME_CONFIG, state, seed: 42 })
    const updated: GameState = { ...state, phase: 'playing' }
    updateRoomState(db, 'ABC123', updated)
    const row = getRoom(db, 'ABC123')
    const parsed = JSON.parse(row!.state_json) as GameState
    expect(parsed.phase).toBe('playing')
  })
})

describe('players', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    applyMigrations(db)
    createRoom(db, {
      code: 'ROOM01',
      themeId: 'town77',
      config: DEFAULT_GAME_CONFIG,
      state: makeState(),
      seed: 1,
    })
  })

  afterEach(() => db.close())

  it('createPlayer + getPlayerByToken round-trips', () => {
    createPlayer(db, { id: 'p1', roomCode: 'ROOM01', name: 'Alice', sessionToken: 'tok-alice' })
    const row = getPlayerByToken(db, 'tok-alice')
    expect(row).toBeDefined()
    expect(row!.id).toBe('p1')
    expect(row!.name).toBe('Alice')
    expect(row!.room_code).toBe('ROOM01')
  })

  it('getPlayerByToken returns undefined for unknown token', () => {
    expect(getPlayerByToken(db, 'unknown')).toBeUndefined()
  })

  it('getPlayersByRoom returns all players in insertion order', () => {
    createPlayer(db, { id: 'p1', roomCode: 'ROOM01', name: 'Alice', sessionToken: 'tok-a' })
    createPlayer(db, { id: 'p2', roomCode: 'ROOM01', name: 'Bob', sessionToken: 'tok-b' })
    const rows = getPlayersByRoom(db, 'ROOM01')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.name).toBe('Alice')
    expect(rows[1]!.name).toBe('Bob')
  })
})
