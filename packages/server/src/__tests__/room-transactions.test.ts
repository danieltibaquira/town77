import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_GAME_CONFIG, type RoomJoinedPayload } from '@town77/shared-types'
import { connectClient, createTestServer, type TestServer } from './helpers/test-server'

function onceError(client: ReturnType<TestServer['connect']>) {
  return new Promise<{ code: string }>((resolve) => client.once('error', resolve))
}

describe('room persistence transactions', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('does not leave a room behind when host player creation fails', async () => {
    server.db.exec(`
      CREATE TRIGGER reject_alice BEFORE INSERT ON players
      WHEN NEW.name = 'Alice'
      BEGIN SELECT RAISE(ABORT, 'player insert rejected'); END;
    `)
    const client = await connectClient(server)
    const error = onceError(client)

    client.emit('create_room', {
      config: DEFAULT_GAME_CONFIG,
      themeId: 'neo',
      playerName: 'Alice',
    })

    await expect(error).resolves.toMatchObject({ code: 'INTERNAL_ERROR' })
    expect(server.db.prepare('SELECT COUNT(*) AS count FROM rooms').get()).toEqual({ count: 0 })
    expect(server.db.prepare('SELECT COUNT(*) AS count FROM players').get()).toEqual({ count: 0 })
    client.disconnect()
  })

  it('does not add a player to room state when player persistence fails', async () => {
    const host = await connectClient(server)
    const { code } = await new Promise<RoomJoinedPayload>((resolve) => {
      host.once('room_joined', resolve)
      host.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'neo',
        playerName: 'Alice',
      })
    })
    server.db.exec(`
      CREATE TRIGGER reject_bob BEFORE INSERT ON players
      WHEN NEW.name = 'Bob'
      BEGIN SELECT RAISE(ABORT, 'player insert rejected'); END;
    `)
    const guest = await connectClient(server)
    const error = onceError(guest)

    guest.emit('join_room', { code, playerName: 'Bob' })

    await expect(error).resolves.toMatchObject({ code: 'INTERNAL_ERROR' })
    const room = server.db.prepare('SELECT state_json FROM rooms WHERE code = ?').get(code) as {
      state_json: string
    }
    expect(JSON.parse(room.state_json).players).toHaveLength(1)
    expect(server.db.prepare('SELECT COUNT(*) AS count FROM players WHERE room_code = ?').get(code)).toEqual({ count: 1 })
    host.disconnect()
    guest.disconnect()
  })
})
