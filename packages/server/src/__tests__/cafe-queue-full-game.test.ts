import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_CAFE_QUEUE_CONFIG, type CafeQueueState, type RoomJoinedPayload, type StateUpdatePayload } from '@town77/shared-types'
import { connectClient, createTestServer, type TestServer } from './helpers/test-server'

describe('Cafe Queue full game', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('persists the final-round boundary and emits server-calculated results', async () => {
    const host = await connectClient(server)
    const guest = await connectClient(server)
    const third = await connectClient(server)
    const joined = await new Promise<RoomJoinedPayload>((resolve) => {
      host.once('room_joined', resolve)
      host.emit('create_room', { config: DEFAULT_CAFE_QUEUE_CONFIG, themeId: 'neobrutalism', playerName: 'Ada', seed: 44 })
    })
    const lobby = new Promise<void>((resolve) => host.once('state_update', () => resolve()))
    await new Promise<RoomJoinedPayload>((resolve) => {
      guest.once('room_joined', resolve)
      guest.emit('join_room', { code: joined.code, playerName: 'Bea' })
    })
    await lobby
    const lobbyHost = new Promise<void>((resolve) => host.once('state_update', () => resolve()))
    const lobbyGuest = new Promise<void>((resolve) => guest.once('state_update', () => resolve()))
    await new Promise<RoomJoinedPayload>((resolve) => {
      third.once('room_joined', resolve)
      third.emit('join_room', { code: joined.code, playerName: 'Cam' })
    })
    await Promise.all([lobbyHost, lobbyGuest])
    const started = new Promise<void>((resolve) => host.once('state_update', () => resolve()))
    const startedGuest = new Promise<void>((resolve) => guest.once('state_update', () => resolve()))
    const startedThird = new Promise<void>((resolve) => third.once('state_update', () => resolve()))
    host.emit('start_game')
    await Promise.all([started, startedGuest, startedThird])

    const stored = JSON.parse((server.db.prepare('SELECT state_json FROM rooms WHERE code = ?').get(joined.code) as { state_json: string }).state_json) as CafeQueueState
    server.db.prepare('UPDATE rooms SET state_json = ? WHERE code = ?').run(JSON.stringify({ ...stored, orderDeck: [] }), joined.code)

    const arm = new Promise<StateUpdatePayload>((resolve) => host.once('state_update', resolve))
    const armGuest = new Promise<void>((resolve) => guest.once('state_update', () => resolve()))
    host.emit('cafe_queue_action', { action: { type: 'end_turn' } })
    const armedState = (await arm).state as unknown as CafeQueueState
    await armGuest
    expect(armedState.phase).toBe('playing')
    expect(armedState.closeArmed).toBe(true)
    expect(armedState.turnIndex).toBe(1)

    const guestTurn = new Promise<StateUpdatePayload>((resolve) => guest.once('state_update', resolve))
    const guestTurnHost = new Promise<void>((resolve) => host.once('state_update', () => resolve()))
    const guestTurnThird = new Promise<void>((resolve) => third.once('state_update', () => resolve()))
    guest.emit('cafe_queue_action', { action: { type: 'end_turn' } })
    const afterGuest = (await guestTurn).state as unknown as CafeQueueState
    await Promise.all([guestTurnHost, guestTurnThird])
    expect(afterGuest.phase).toBe('playing')
    expect(afterGuest.turnIndex).toBe(2)

    const thirdTurn = new Promise<StateUpdatePayload>((resolve) => third.once('state_update', resolve))
    const thirdTurnHost = new Promise<void>((resolve) => host.once('state_update', () => resolve()))
    const thirdTurnGuest = new Promise<void>((resolve) => guest.once('state_update', () => resolve()))
    third.emit('cafe_queue_action', { action: { type: 'end_turn' } })
    const afterThird = (await thirdTurn).state as unknown as CafeQueueState
    await Promise.all([thirdTurnHost, thirdTurnGuest])
    expect(afterThird.phase).toBe('playing')
    expect(afterThird.turnIndex).toBe(0)

    const finalState = new Promise<StateUpdatePayload>((resolve) => host.once('state_update', resolve))
    const finalGuest = new Promise<void>((resolve) => guest.once('state_update', () => resolve()))
    const finalThird = new Promise<void>((resolve) => third.once('state_update', () => resolve()))
    const gameOver = new Promise<{ scores: Array<{ playerId: string; rating: number }> }>((resolve) => host.once('game_over', resolve))
    host.emit('cafe_queue_action', { action: { type: 'end_turn' } })
    expect((await finalState).state.phase).toBe('finished')
    await Promise.all([finalGuest, finalThird])
    expect((await gameOver).scores.map((score) => score.playerId)).toEqual([joined.playerId, expect.any(String), expect.any(String)])

    const persisted = JSON.parse((server.db.prepare('SELECT state_json FROM rooms WHERE code = ?').get(joined.code) as { state_json: string }).state_json) as CafeQueueState
    expect(persisted.phase).toBe('finished')
    host.disconnect()
    guest.disconnect()
    third.disconnect()
  })
})
