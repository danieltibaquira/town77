import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_GAME_CONFIG, type GameState } from '@town77/shared-types'
import { createGrid } from '@town77/game-engine'
import { applyMigrations } from '../db/client'
import { deleteExpiredRooms } from '../db/room-cleanup'

const now = 1_000_000_000

function state(phase: GameState['phase'], connected: boolean): GameState {
  return {
    grid: createGrid(7, 7), bag: [], turnIndex: 0, phase, config: DEFAULT_GAME_CONFIG, themeId: 'neo', seed: 1,
    players: [{ id: `p-${phase}-${connected}`, name: 'Player', hand: [], placed: 0, hasDiscarded: false, connected }],
  }
}

describe('deleteExpiredRooms', () => {
  let db: Database.Database

  beforeEach(() => { db = new Database(':memory:'); applyMigrations(db) })
  afterEach(() => db.close())

  it('removes inactive old lobbies and old finished rooms but retains active rooms', () => {
    const insert = db.prepare(`INSERT INTO rooms (code, theme_id, config_json, state_json, seed, created_at, updated_at) VALUES (?, 'neo', '{}', ?, 1, ?, ?)`)
    const add = (code: string, game: GameState, updatedAt: number) => {
      insert.run(code, JSON.stringify(game), updatedAt, updatedAt)
      db.prepare('INSERT INTO players (id, room_code, name, session_token, created_at) VALUES (?, ?, ?, ?, ?)').run(game.players[0]!.id, code, 'Player', `token-${code}`, updatedAt)
    }
    add('LOBBY1', state('lobby', false), now - 24 * 60 * 60 * 1000 - 1)
    add('DONE01', state('finished', false), now - 7 * 24 * 60 * 60 * 1000 - 1)
    add('ACTIVE', state('playing', false), now - 30 * 24 * 60 * 60 * 1000)
    add('LOBBY2', state('lobby', true), now - 24 * 60 * 60 * 1000 - 1)

    expect(deleteExpiredRooms(db, now)).toBe(2)
    expect(db.prepare('SELECT code FROM rooms ORDER BY code').all()).toEqual([{ code: 'ACTIVE' }, { code: 'LOBBY2' }])
    expect(db.prepare('SELECT COUNT(*) AS count FROM players').get()).toEqual({ count: 2 })
  })
})
