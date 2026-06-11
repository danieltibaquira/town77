import type { RoomJoinedPayload, StateUpdatePayload } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type TestClient,
  type TestServer,
  connectClient,
  createTestServer,
} from './helpers/test-server'

async function startGame(server: TestServer) {
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
  await new Promise<RoomJoinedPayload>((resolve) => {
    guest.on('room_joined', resolve)
    guest.emit('join_room', { code, playerName: 'Bob' })
  })
  // wait for the join broadcast to arrive at host before starting
  await new Promise<void>((resolve) => {
    host.once('state_update', () => resolve())
  })

  const started = new Promise<StateUpdatePayload>((resolve) => host.once('state_update', resolve))
  host.emit('start_game')
  const state = (await started).state
  return { host, guest, code, state }
}

describe('place_chip', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('valid first placement updates state for all players', async () => {
    const { host, guest, state } = await startGame(server)

    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest
    const chipToPlace = state.players[turnIdx]!.hand[0]!

    const hostUpdate = new Promise<StateUpdatePayload>((resolve) =>
      host.once('state_update', resolve),
    )
    const guestUpdate = new Promise<StateUpdatePayload>((resolve) =>
      guest.once('state_update', resolve),
    )

    activeClient.emit('place_chip', { chip: chipToPlace, row: 3, col: 3 })

    const [h] = await Promise.all([hostUpdate, guestUpdate])
    expect(h.state.grid[3]![3]).toMatchObject({
      color: chipToPlace.color,
      shape: chipToPlace.shape,
    })
    expect(h.state.players[turnIdx]!.placed).toBe(1)

    host.disconnect()
    guest.disconnect()
  })

  it("emits error when it is not the caller's turn", async () => {
    const { host, guest, state } = await startGame(server)

    const wrongClient = state.turnIndex === 0 ? guest : host
    const wrongIdx = state.turnIndex === 0 ? 1 : 0
    const chip = state.players[wrongIdx]!.hand[0]!

    const err = await new Promise<{ code: string }>((resolve) => {
      wrongClient.once('error', resolve)
      wrongClient.emit('place_chip', { chip, row: 3, col: 3 })
    })
    expect(err.code).toBe('NOT_YOUR_TURN')
    host.disconnect()
    guest.disconnect()
  })

  it('emits error for invalid placement (chip not in hand)', async () => {
    const { host, guest, state } = await startGame(server)

    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest
    const fakeChip = { color: 'color-99', shape: 'ghost' }

    const err = await new Promise<{ code: string }>((resolve) => {
      activeClient.once('error', resolve)
      activeClient.emit('place_chip', { chip: fakeChip, row: 3, col: 3 })
    })
    expect(err.code).toBe('INVALID_PLACEMENT')
    host.disconnect()
    guest.disconnect()
  })
})
