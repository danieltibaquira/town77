import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { applyMigrations } from '../db/client'
import { runInTransaction } from '../db/transactions'

describe('runInTransaction', () => {
  const db = new Database(':memory:')
  applyMigrations(db)

  afterEach(() => {
    db.exec('DELETE FROM players; DELETE FROM rooms;')
  })

  it('rolls back an earlier write when later work fails', () => {
    expect(() =>
      runInTransaction(db, () => {
        db.prepare(
          `INSERT INTO rooms (code, theme_id, config_json, state_json, seed, created_at, updated_at)
           VALUES ('ABC123', 'neo', '{}', '{}', 1, 1, 1)`,
        ).run()
        throw new Error('second write failed')
      }),
    ).toThrow('second write failed')

    expect(db.prepare('SELECT COUNT(*) AS count FROM rooms').get()).toEqual({ count: 0 })
  })
})
