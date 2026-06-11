import type { RoomJoinedPayload } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type TestClient,
  type TestServer,
  connectClient,
  createTestServer,
} from './helpers/test-server'

describe('create_room', () => {
  let server: TestServer
  let client: TestClient

  beforeEach(async () => {
    server = await createTestServer()
    client = await connectClient(server)
  })

  afterEach(() => {
    client.disconnect()
    server.close()
  })

  it('emits room_joined with valid 6-char room code', async () => {
    const payload = await new Promise<RoomJoinedPayload>((resolve) => {
      client.on('room_joined', resolve)
      client.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Alice',
      })
    })
    expect(payload.code).toMatch(/^[A-Z2-9]{6}$/)
    expect(payload.playerId).toHaveLength(32)
    expect(payload.sessionToken).toHaveLength(64)
    expect(payload.state.phase).toBe('lobby')
    expect(payload.state.players).toHaveLength(1)
    expect(payload.state.players[0]!.name).toBe('Alice')
    expect(payload.state.players[0]!.connected).toBe(true)
    expect(payload.state.players[0]!.hand).toHaveLength(0)
  })

  it('persists room and player to SQLite', async () => {
    await new Promise<RoomJoinedPayload>((resolve) => {
      client.on('room_joined', resolve)
      client.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Alice',
      })
    })
    const roomCount = (server.db.prepare('SELECT COUNT(*) as n FROM rooms').get() as { n: number })
      .n
    const playerCount = (
      server.db.prepare('SELECT COUNT(*) as n FROM players').get() as { n: number }
    ).n
    expect(roomCount).toBe(1)
    expect(playerCount).toBe(1)
  })

  it('initialises bag with correct chip count in state', async () => {
    const payload = await new Promise<RoomJoinedPayload>((resolve) => {
      client.on('room_joined', resolve)
      client.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Alice',
      })
    })
    // Default config: 7 colors × 7 shapes × 1 copy = 49 chips
    expect(payload.state.bag).toHaveLength(49)
  })
})
