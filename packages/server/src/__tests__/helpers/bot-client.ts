import type { RoomJoinedPayload, StateUpdatePayload, GameConfig } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { findBotAction } from '@town77/game-engine'
import { getValidCells, isFirstChipOnGrid } from '@town77/game-engine'
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
    if (player.hand.length === 0) return

    const isFirst = isFirstChipOnGrid(state.grid)

    for (const chip of player.hand) {
      const valid = getValidCells(state.grid, chip, isFirst)
      if (valid.length > 0) {
        ctx.client.emit('place_chip', { chip, row: valid[0]![0], col: valid[0]![1] })
        return
      }
    }

    if (!player.hasDiscarded && player.hand.length > 0) {
      ctx.client.emit('discard_chip', { chip: player.hand[0]! })
      return
    }
  })
}

export async function createBotHost(
  server: TestServer,
  playerName: string,
  config?: Partial<GameConfig>,
): Promise<{ bot: BotClient; code: string }> {
  const client = await connectClient(server)
  const gameConfig = { ...DEFAULT_GAME_CONFIG, ...config }

  const { code, playerId } = await new Promise<RoomJoinedPayload>((resolve) => {
    client.on('room_joined', resolve)
    client.emit('create_room', { config: gameConfig, themeId: 'town77', playerName })
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
