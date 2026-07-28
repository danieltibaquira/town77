import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_GAME_CONFIG, type RoomJoinedPayload } from '@town77/shared-types'
import { PresenceRegistry } from '../socket/presence'
import { connectClient, createTestServer, type TestServer } from './helpers/test-server'

describe('PresenceRegistry', () => {
  it('keeps a player present until their final socket disconnects', () => {
    const presence = new PresenceRegistry()

    expect(presence.connect('player-1', 'socket-a')).toBe(1)
    expect(presence.connect('player-1', 'socket-b')).toBe(2)
    expect(presence.disconnect('player-1', 'socket-a')).toBe(1)
    expect(presence.count('player-1')).toBe(1)
    expect(presence.disconnect('player-1', 'socket-b')).toBe(0)
    expect(presence.count('player-1')).toBe(0)
  })
})

describe('socket presence', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('keeps a player connected when one of two tabs disconnects', async () => {
    const firstTab = await connectClient(server)
    const room = await new Promise<RoomJoinedPayload>((resolve) => {
      firstTab.once('room_joined', resolve)
      firstTab.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'neo',
        playerName: 'Alice',
      })
    })
    const secondTab = await connectClient(server)
    await new Promise<RoomJoinedPayload>((resolve) => {
      secondTab.once('room_joined', resolve)
      secondTab.emit('join_room', {
        code: room.code,
        playerName: 'Alice',
        sessionToken: room.sessionToken,
      })
    })
    firstTab.disconnect()
    await new Promise((resolve) => setTimeout(resolve, 25))

    const persisted = server.db.prepare('SELECT state_json FROM rooms WHERE code = ?').get(room.code) as {
      state_json: string
    }
    expect(JSON.parse(persisted.state_json).players).toEqual([
      expect.objectContaining({ id: room.playerId, connected: true }),
    ])
    secondTab.disconnect()
  })
})
