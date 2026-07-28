import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_CAFE_QUEUE_CONFIG, type CafeQueueState, type RoomJoinedPayload, type StateUpdatePayload } from '@town77/shared-types'
import { connectClient, createTestServer, type TestServer } from './helpers/test-server'

function asCafe(state: unknown): CafeQueueState {
  return state as CafeQueueState
}

describe('cafe_queue_action', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('persists an authorized move before broadcasting recipient-specific state', async () => {
    const host = await connectClient(server)
    const guest = await connectClient(server)
    const joined = await new Promise<RoomJoinedPayload>((resolve) => {
      host.once('room_joined', resolve)
      host.emit('create_room', { config: DEFAULT_CAFE_QUEUE_CONFIG, themeId: 'neo', playerName: 'Ada', seed: 17 })
    })

    const lobbyUpdate = new Promise<void>((resolve) => host.once('state_update', () => resolve()))
    await new Promise<RoomJoinedPayload>((resolve) => {
      guest.once('room_joined', resolve)
      guest.emit('join_room', { code: joined.code, playerName: 'Bea' })
    })
    await lobbyUpdate

    const startHost = new Promise<StateUpdatePayload>((resolve) => host.once('state_update', resolve))
    const startGuest = new Promise<StateUpdatePayload>((resolve) => guest.once('state_update', resolve))
    host.emit('start_game')
    await Promise.all([startHost, startGuest])

    const rejected = new Promise<{ code: string }>((resolve) => guest.once('error', resolve))
    guest.emit('cafe_queue_action', { action: { type: 'move_meeple', meepleIndex: 0, path: ['r1c2'], rushSpent: 0 } })
    expect((await rejected).code).toBe('NOT_YOUR_TURN')

    const malformed = new Promise<{ code: string }>((resolve) => host.once('error', resolve))
    host.emit('cafe_queue_action', { action: { type: 'not-an-action' } } as never)
    expect((await malformed).code).toBe('INVALID_GAME_ACTION')

    const hostUpdate = new Promise<StateUpdatePayload>((resolve) => host.once('state_update', resolve))
    const guestUpdate = new Promise<StateUpdatePayload>((resolve) => guest.once('state_update', resolve))
    host.emit('cafe_queue_action', { action: { type: 'move_meeple', meepleIndex: 0, path: ['r1c0'], rushSpent: 0 } })
    const [hostState, guestState] = await Promise.all([hostUpdate, guestUpdate])
    const hostCafe = asCafe(hostState.state)
    const guestCafe = asCafe(guestState.state)

    expect(hostCafe.players[0]?.meeplePositions[0]).toBe('r1c0')
    expect(hostCafe.players[0]?.collectedThisTurn).toEqual({ water: 1 })
    expect(guestCafe.players[0]?.collectedThisTurn).toEqual({})
    expect(guestCafe.orderDeck).toEqual([])

    const persisted = asCafe(JSON.parse((server.db.prepare('SELECT state_json FROM rooms WHERE code = ?').get(joined.code) as { state_json: string }).state_json))
    expect(persisted.players[0]?.meeplePositions[0]).toBe('r1c0')
    expect(persisted.players[0]?.collectedThisTurn).toEqual({ water: 1 })

    host.disconnect()
    guest.disconnect()
  })

  it('restores the private player view from the persisted snapshot after reconnect', async () => {
    const host = await connectClient(server)
    const guest = await connectClient(server)
    const joined = await new Promise<RoomJoinedPayload>((resolve) => {
      host.once('room_joined', resolve)
      host.emit('create_room', { config: DEFAULT_CAFE_QUEUE_CONFIG, themeId: 'neo', playerName: 'Ada', seed: 21 })
    })
    const lobbyUpdate = new Promise<void>((resolve) => host.once('state_update', () => resolve()))
    await new Promise<RoomJoinedPayload>((resolve) => {
      guest.once('room_joined', resolve)
      guest.emit('join_room', { code: joined.code, playerName: 'Bea' })
    })
    await lobbyUpdate
    const started = new Promise<void>((resolve) => host.once('state_update', () => resolve()))
    host.emit('start_game')
    await started
    const moved = new Promise<void>((resolve) => host.once('state_update', () => resolve()))
    host.emit('cafe_queue_action', { action: { type: 'move_meeple', meepleIndex: 0, path: ['r1c0'], rushSpent: 0 } })
    await moved
    host.disconnect()

    const reconnected = await connectClient(server)
    const restored = await new Promise<RoomJoinedPayload>((resolve) => {
      reconnected.once('room_joined', resolve)
      reconnected.emit('join_room', { code: joined.code, playerName: 'ignored', sessionToken: joined.sessionToken })
    })

    const restoredCafe = asCafe(restored.state)
    expect(restored.playerId).toBe(joined.playerId)
    expect(restoredCafe.players[0]?.meeplePositions[0]).toBe('r1c0')
    expect(restoredCafe.players[0]?.collectedThisTurn).toEqual({ water: 1 })
    expect(restoredCafe.orderDeck).toEqual([])

    guest.disconnect()
    reconnected.disconnect()
  })
})
