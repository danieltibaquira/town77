import type { RoomJoinedPayload, StateUpdatePayload } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type TestClient,
  type TestServer,
  connectClient,
  createTestServer,
} from './helpers/test-server'

async function createRoomAs(client: TestClient, name: string): Promise<RoomJoinedPayload> {
  return new Promise((resolve) => {
    client.on('room_joined', resolve)
    client.emit('create_room', {
      config: DEFAULT_GAME_CONFIG,
      themeId: 'town77',
      playerName: name,
    })
  })
}

describe('join_room', () => {
  let server: TestServer
  let host: TestClient
  let guest: TestClient

  beforeEach(async () => {
    server = await createTestServer()
    host = await connectClient(server)
    guest = await connectClient(server)
  })

  afterEach(() => {
    host.disconnect()
    guest.disconnect()
    server.close()
  })

  it('guest joins an existing lobby room', async () => {
    const { code } = await createRoomAs(host, 'Alice')

    const guestPayload = await new Promise<RoomJoinedPayload>((resolve) => {
      guest.on('room_joined', resolve)
      guest.emit('join_room', { code, playerName: 'Bob' })
    })

    expect(guestPayload.code).toBe(code)
    expect(guestPayload.state.players).toHaveLength(2)
    expect(guestPayload.state.players[1]!.name).toBe('Bob')
  })

  it('host receives state_update when guest joins', async () => {
    const { code } = await createRoomAs(host, 'Alice')

    const stateUpdate = new Promise<StateUpdatePayload>((resolve) => {
      host.on('state_update', resolve)
    })

    guest.emit('join_room', { code, playerName: 'Bob' })
    const update = await stateUpdate
    expect(update.state.players).toHaveLength(2)
  })

  it('emits error for unknown room code', async () => {
    const err = await new Promise<{ code: string }>((resolve) => {
      guest.on('error', resolve)
      guest.emit('join_room', { code: 'XXXXXX', playerName: 'Bob' })
    })
    expect(err.code).toBe('ROOM_NOT_FOUND')
  })

  it('session recovery: reconnecting with sessionToken restores player', async () => {
    const { code, sessionToken, playerId } = await createRoomAs(host, 'Alice')

    const returner = await connectClient(server)
    const recovered = await new Promise<RoomJoinedPayload>((resolve) => {
      returner.on('room_joined', resolve)
      returner.emit('join_room', { code, playerName: 'Alice', sessionToken })
    })

    expect(recovered.playerId).toBe(playerId)
    expect(recovered.sessionToken).toBe(sessionToken)
    returner.disconnect()
  })
})
