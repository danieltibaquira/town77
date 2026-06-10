import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { RoomJoinedPayload, StateUpdatePayload } from '@town77/shared-types'
import type { Chip } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createTestServer, connectClient, type TestServer, type TestClient } from './helpers/test-server'

async function startGame(server: TestServer) {
  const host = await connectClient(server)
  const guest = await connectClient(server)

  const { code } = await new Promise<RoomJoinedPayload>((resolve) => {
    host.on('room_joined', resolve)
    host.emit('create_room', { config: DEFAULT_GAME_CONFIG, themeId: 'town77', playerName: 'Alice' })
  })
  await new Promise<RoomJoinedPayload>((resolve) => {
    guest.on('room_joined', resolve)
    guest.emit('join_room', { code, playerName: 'Bob' })
  })
  await new Promise<void>((resolve) => { host.once('state_update', () => resolve()) })

  const started = new Promise<StateUpdatePayload>((resolve) => host.once('state_update', resolve))
  host.emit('start_game')
  const state = (await started).state
  return { host, guest, code, state }
}

describe('exchange_chips', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('exchanges chips and advances turn', async () => {
    const { host, guest, state } = await startGame(server)
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest

    // Force a hand with 3 same-color chips in DB so canExchange passes
    const color = DEFAULT_GAME_CONFIG.chips.colors[0]!
    const shapes = DEFAULT_GAME_CONFIG.chips.shapes
    const forcedHand: Chip[] = [
      { color, shape: shapes[0]! },
      { color, shape: shapes[1]! },
      { color, shape: shapes[2]! },
      { color: DEFAULT_GAME_CONFIG.chips.colors[1]!, shape: shapes[3]! },
    ]
    const row = server.db.prepare('SELECT * FROM rooms').get() as { code: string; state_json: string }
    const s = JSON.parse(row.state_json) as typeof state
    s.players[turnIdx]!.hand = forcedHand
    server.db.prepare('UPDATE rooms SET state_json = ? WHERE code = ?').run(JSON.stringify(s), row.code)

    const stateUpdate = new Promise<StateUpdatePayload>((resolve) => {
      host.once('state_update', resolve)
    })

    activeClient.emit('exchange_chips', { chips: forcedHand.slice(0, 3) })
    const updated = await stateUpdate

    expect(updated.state.turnIndex).toBe((turnIdx + 1) % 2)
    expect(updated.state.players[turnIdx]!.hand).toHaveLength(4)

    host.disconnect()
    guest.disconnect()
  })

  it('emits error when chips do not share color or shape', async () => {
    const { host, guest, state } = await startGame(server)
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest

    // Chips with different colors AND different shapes — canExchange will reject
    const mixedChips: Chip[] = [
      { color: 'color-1', shape: 'cottage' },
      { color: 'color-2', shape: 'tower' },
      { color: 'color-3', shape: 'barn' },
    ]

    const err = await new Promise<{ code: string }>((resolve) => {
      activeClient.once('error', resolve)
      activeClient.emit('exchange_chips', { chips: mixedChips })
    })
    expect(err.code).toBe('INVALID_EXCHANGE')
    host.disconnect()
    guest.disconnect()
  })
})

describe('discard_chip', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('discards chip and advances turn', async () => {
    const { host, guest, state } = await startGame(server)
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest
    const chip = state.players[turnIdx]!.hand[0]!

    const stateUpdate = new Promise<StateUpdatePayload>((resolve) => host.once('state_update', resolve))
    activeClient.emit('discard_chip', { chip })
    const updated = await stateUpdate

    expect(updated.state.turnIndex).toBe((turnIdx + 1) % 2)
    expect(updated.state.players[turnIdx]!.hasDiscarded).toBe(true)
    host.disconnect()
    guest.disconnect()
  })

  it('emits error if player already discarded this game', async () => {
    const { host, guest, state } = await startGame(server)
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest

    // Force hasDiscarded = true in DB
    const row = server.db.prepare('SELECT * FROM rooms').get() as { code: string; state_json: string }
    const s = JSON.parse(row.state_json) as typeof state
    s.players[turnIdx]!.hasDiscarded = true
    server.db.prepare('UPDATE rooms SET state_json = ? WHERE code = ?').run(JSON.stringify(s), row.code)

    const chip = state.players[turnIdx]!.hand[0]!
    const err = await new Promise<{ code: string }>((resolve) => {
      activeClient.once('error', resolve)
      activeClient.emit('discard_chip', { chip })
    })
    expect(err.code).toBe('ALREADY_DISCARDED')
    host.disconnect()
    guest.disconnect()
  })
})
