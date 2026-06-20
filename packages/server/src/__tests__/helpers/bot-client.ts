import type { RoomJoinedPayload, StateUpdatePayload, GameConfig } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { findBotAction } from '@town77/game-engine'
import { connectClient, type TestServer, type TestClient } from './test-server'

export interface BotClient extends TestClient {
  botId: string
}

export interface BotClientOptions {
  seed: number
}

interface AutoPlayContext {
  playerId: string
  client: TestClient
}

function wireAutoPlay(client: TestClient, ctx: AutoPlayContext) {
  client.on('state_update', (payload: StateUpdatePayload) => {
    const state = payload.state
    if (state.phase !== 'playing') return

    const player = state.players[state.turnIndex]
    if (!player || player.id !== ctx.playerId) return

    // Decision ladder lives in findBotAction: place > exchange (3 same color)
    // > discard (once) > pass. A pass-only player is skipped by the server's
    // turn advancement, so emitting nothing is correct.
    const action = findBotAction(state, ctx.playerId)
    if (!action) return

    if (action.type === 'place') {
      ctx.client.emit('place_chip', { chip: action.chip, row: action.row, col: action.col })
    } else if (action.type === 'exchange') {
      ctx.client.emit('exchange_chips', { chips: action.chips })
    } else if (action.type === 'discard') {
      ctx.client.emit('discard_chip', { chip: action.chip })
    }
  })
}

export async function createBotHost(
  server: TestServer,
  playerName: string,
  config?: Partial<GameConfig>,
  seed?: number,
): Promise<{ bot: BotClient; code: string }> {
  const client = await connectClient(server)
  const gameConfig = { ...DEFAULT_GAME_CONFIG, ...config }

  const { code, playerId } = await new Promise<RoomJoinedPayload>((resolve) => {
    client.on('room_joined', resolve)
    client.emit('create_room', { config: gameConfig, themeId: 'town77', playerName, seed })
  })

  wireAutoPlay(client, { playerId, client })

  return { bot: Object.assign(client, { botId: playerId }), code }
}

export async function createBotClient(
  server: TestServer,
  roomCode: string,
  playerName: string,
): Promise<BotClient> {
  const client = await connectClient(server)

  const { playerId } = await new Promise<RoomJoinedPayload>((resolve) => {
    client.on('room_joined', resolve)
    client.emit('join_room', { code: roomCode, playerName })
  })

  wireAutoPlay(client, { playerId, client })

  return Object.assign(client, { botId: playerId })
}
