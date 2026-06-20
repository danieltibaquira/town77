import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { RoomJoinedPayload, StateUpdatePayload } from '@town77/shared-types'
import type { Chip } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createTestServer, connectClient, type TestServer } from './helpers/test-server'

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

function buildFullGrid(): Chip[][] {
  const { colors, shapes } = DEFAULT_GAME_CONFIG.chips
  return Array.from({ length: 7 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => {
      const idx = r * 7 + c
      return { color: colors[idx % colors.length]!, shape: shapes[Math.floor(idx / colors.length) % shapes.length]! }
    }),
  )
}

describe('discard_chip', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('emits game_over when discard empties the bag and no valid moves remain', async () => {
    const { host, guest, state } = await startGame(server)
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest
    const chip = state.players[turnIdx]!.hand[0]!

    const row = server.db.prepare('SELECT * FROM rooms').get() as { code: string; state_json: string }
    const s = JSON.parse(row.state_json) as typeof state
    s.bag = []
    s.grid = buildFullGrid()
    s.players[turnIdx]!.hand = [chip]
    s.players[turnIdx]!.hasDiscarded = false
    for (let i = 0; i < s.players.length; i++) {
      if (i !== turnIdx) {
        s.players[i]!.hand = []
        s.players[i]!.hasDiscarded = false
      }
    }
    server.db.prepare('UPDATE rooms SET state_json = ? WHERE code = ?').run(JSON.stringify(s), row.code)

    const gameOver = new Promise<{ scores: unknown[] }>((resolve) => {
      host.once('game_over', resolve)
    })
    activeClient.emit('discard_chip', { chip })

    const result = await gameOver
    expect(result.scores).toHaveLength(2)
    host.disconnect()
    guest.disconnect()
  }, 5000)
})
