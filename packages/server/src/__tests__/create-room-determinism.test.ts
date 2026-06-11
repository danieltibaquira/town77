import type { RoomJoinedPayload } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type TestClient,
  type TestServer,
  connectClient,
  createTestServer,
} from './helpers/test-server'

describe('create_room determinism', () => {
  let server: TestServer
  let client1: TestClient
  let client2: TestClient

  beforeEach(async () => {
    server = await createTestServer()
    client1 = await connectClient(server)
    client2 = await connectClient(server)
  })

  afterEach(() => {
    client1.disconnect()
    client2.disconnect()
    server.close()
  })

  it('produces identical bag from the same seed', async () => {
    const payload1 = await new Promise<RoomJoinedPayload>((resolve) => {
      client1.on('room_joined', resolve)
      client1.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Alice',
        seed: 42,
      })
    })

    const payload2 = await new Promise<RoomJoinedPayload>((resolve) => {
      client2.on('room_joined', resolve)
      client2.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Bob',
        seed: 42,
      })
    })

    expect(payload1.state.bag).toEqual(payload2.state.bag)
    expect(payload1.state.seed).toBe(42)
    expect(payload2.state.seed).toBe(42)
  })

  it('produces different bag from different seeds', async () => {
    const payload1 = await new Promise<RoomJoinedPayload>((resolve) => {
      client1.on('room_joined', resolve)
      client1.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Alice',
        seed: 42,
      })
    })

    const payload2 = await new Promise<RoomJoinedPayload>((resolve) => {
      client2.on('room_joined', resolve)
      client2.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Bob',
        seed: 99,
      })
    })

    expect(payload1.state.bag).not.toEqual(payload2.state.bag)
  })

  it('works without seed (random) for backward compatibility', async () => {
    const payload = await new Promise<RoomJoinedPayload>((resolve) => {
      client1.on('room_joined', resolve)
      client1.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Alice',
      })
    })

    expect(payload.state.bag).toHaveLength(49)
    expect(payload.state.seed).toBeGreaterThanOrEqual(0)
  })
})
