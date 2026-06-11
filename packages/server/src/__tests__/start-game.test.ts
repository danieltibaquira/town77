import type { RoomJoinedPayload, StateUpdatePayload } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type TestClient,
  type TestServer,
  connectClient,
  createTestServer,
} from './helpers/test-server'

async function setupLobby(server: TestServer) {
  const host = await connectClient(server)
  const guest = await connectClient(server)

  const { code } = await new Promise<RoomJoinedPayload>((resolve) => {
    host.on('room_joined', resolve)
    host.emit('create_room', {
      config: DEFAULT_GAME_CONFIG,
      themeId: 'town77',
      playerName: 'Alice',
    })
  })

  // Register host state_update listener BEFORE guest joins so the lobby broadcast is consumed here
  const hostLobbyUpdate = new Promise<void>((resolve) => {
    host.once('state_update', () => resolve())
  })

  await new Promise<RoomJoinedPayload>((resolve) => {
    guest.on('room_joined', resolve)
    guest.emit('join_room', { code, playerName: 'Bob' })
  })

  // Drain the lobby state_update so it doesn't interfere with start_game assertions
  await hostLobbyUpdate

  return { host, guest, code }
}

describe('start_game', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('transitions state to playing and deals hands', async () => {
    const { host, guest, code } = await setupLobby(server)

    const hostUpdate = new Promise<StateUpdatePayload>((resolve) =>
      host.on('state_update', resolve),
    )
    const guestUpdate = new Promise<StateUpdatePayload>((resolve) =>
      guest.on('state_update', resolve),
    )

    host.emit('start_game')

    const [h, g] = await Promise.all([hostUpdate, guestUpdate])
    expect(h.state.phase).toBe('playing')
    expect(h.state.players[0]!.hand).toHaveLength(4)
    expect(h.state.players[1]!.hand).toHaveLength(4)
    expect(h.state.bag).toHaveLength(49 - 8)
    expect(h.state).toEqual(g.state)
    host.disconnect()
    guest.disconnect()
    void code
  })

  it('emits error if caller is not the host', async () => {
    const { host, guest } = await setupLobby(server)

    const err = await new Promise<{ code: string }>((resolve) => {
      guest.on('error', resolve)
      guest.emit('start_game')
    })
    expect(err.code).toBe('NOT_HOST')
    host.disconnect()
    guest.disconnect()
  })

  it('emits error if fewer than 2 players', async () => {
    const solo = await connectClient(server)
    await new Promise<RoomJoinedPayload>((resolve) => {
      solo.on('room_joined', resolve)
      solo.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Solo',
      })
    })

    const err = await new Promise<{ code: string }>((resolve) => {
      solo.on('error', resolve)
      solo.emit('start_game')
    })
    expect(err.code).toBe('NOT_ENOUGH_PLAYERS')
    solo.disconnect()
  })
})
