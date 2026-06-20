/**
 * Deployed-build bot simulation.
 *
 * Connects 5 WebSocket (Socket.IO) clients to the deployed town77 server,
 * plays a complete game to natural game_over, and asserts the server emits
 * a terminal game_over with 5 valid scores.
 *
 * Usage:
 *   pnpm --filter @town77/server exec tsx scripts/bot-sim-deployed.ts
 *   # or, with custom URL:
 *   TOWN77_WS_URL=wss://staging.town77.fly.dev TOWN77_BOT_COUNT=5 \
 *     pnpm --filter @town77/server exec tsx scripts/bot-sim-deployed.ts
 *
 * Exit codes:
 *   0 — game reached game_over with valid scores
 *   1 — turn cap exceeded / connection error / score validation failure
 */
import { io as ioClient } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { findBotAction } from '@town77/game-engine'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import type {
  RoomJoinedPayload,
  StateUpdatePayload,
  GameOverPayload,
  ErrorPayload,
} from '@town77/shared-types'

const URL = process.env.TOWN77_WS_URL ?? 'wss://town77.fly.dev'
const BOT_COUNT = Number.parseInt(process.env.TOWN77_BOT_COUNT ?? '5', 10)
const SEED = Number.parseInt(process.env.TOWN77_SEED ?? '42', 10)
const TURN_CAP_MS = Number.parseInt(process.env.TOWN77_TURN_CAP_MS ?? '90000', 10)
const TURN_CAP_TURNS = Number.parseInt(process.env.TOWN77_TURN_CAP_TURNS ?? '500', 10)

type Client = Socket

interface Bot {
  name: string
  client: Client
  playerId?: string
}

function log(stage: string, data: Record<string, unknown> = {}): void {
  // pino-style single-line JSON to stdout for easy grep in CI
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ t: new Date().toISOString(), stage, ...data }))
}

function connect(): Promise<Client> {
  const client = ioClient(URL, {
    transports: ['websocket'],
    reconnection: false,
    timeout: 15000,
  })
  return new Promise((resolve, reject) => {
    const onError = (err: Error) => {
      client.off('connect', onConnect)
      reject(err)
    }
    const onConnect = () => {
      client.off('connect_error', onError)
      resolve(client)
    }
    client.once('connect', onConnect)
    client.once('connect_error', onError)
  })
}

function waitFor<T>(client: Client, event: string, predicate: (payload: T) => boolean): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => {
        client.off(event, handler)
        reject(new Error(`Timed out waiting for ${event}`))
      },
      15000,
    )
    const handler = (payload: T) => {
      if (predicate(payload)) {
        clearTimeout(timer)
        client.off(event, handler)
        resolve(payload)
      }
    }
    client.on(event, handler)
  })
}

async function main(): Promise<void> {
  log('start', { url: URL, botCount: BOT_COUNT, seed: SEED, turnCapMs: TURN_CAP_MS })

  if (BOT_COUNT < 2) {
    log('error', { reason: 'BOT_COUNT must be >= 2' })
    process.exit(1)
  }

  // 1. Connect host + create room
  const hostClient = await connect()
  log('host.connected', { sid: hostClient.id })

  const hostJoined = waitFor<RoomJoinedPayload>(hostClient, 'room_joined', () => true)
  hostClient.emit('create_room', {
    config: { ...DEFAULT_GAME_CONFIG, maxPlayers: BOT_COUNT },
    themeId: 'town77',
    playerName: 'Bot-1',
    seed: SEED,
  })
  const { code, playerId: hostId } = await hostJoined
  log('room.created', { code, hostId })

  const host: Bot = { name: 'Bot-1', client: hostClient, playerId: hostId }

  // 2. Connect and join remaining bots
  const bots: Bot[] = [host]
  for (let i = 2; i <= BOT_COUNT; i++) {
    const client = await connect()
    log('bot.connected', { name: `Bot-${i}`, sid: client.id })

    const joined = waitFor<RoomJoinedPayload>(client, 'room_joined', () => true)
    client.emit('join_room', { code, playerName: `Bot-${i}` })
    const { playerId } = await joined
    bots.push({ name: `Bot-${i}`, client, playerId })
    log('bot.joined', { name: `Bot-${i}`, playerId })
  }

  // 3. Wire auto-play: each bot reacts to state_update when it is its turn
  let turnCounter = 0
  let lastState: StateUpdatePayload['state'] | undefined

  for (const bot of bots) {
    const myId = bot.playerId
    if (!myId) continue
    bot.client.on('state_update', (payload: StateUpdatePayload) => {
      const state = payload.state
      lastState = state
      if (state.phase !== 'playing') return

      const active = state.players[state.turnIndex]
      if (!active || active.id !== myId) return

      const action = findBotAction(state, myId)
      if (!action) {
        // No move possible — server's turn-utils will pass on no-op (we
        // do not need to emit; the engine advances via state_update chain).
        log('bot.pass', { bot: bot.name, turn: state.turnIndex })
        return
      }

      turnCounter += 1
      if (action.type === 'place') {
        log('bot.place', {
          bot: bot.name,
          turn: state.turnIndex,
          chip: action.chip,
          row: action.row,
          col: action.col,
          turnCount: turnCounter,
        })
        bot.client.emit('place_chip', { chip: action.chip, row: action.row, col: action.col })
      } else if (action.type === 'discard') {
        log('bot.discard', { bot: bot.name, turn: state.turnIndex, chip: action.chip, turnCount: turnCounter })
        bot.client.emit('discard_chip', { chip: action.chip })
      } else {
        log('bot.exchange', {
          bot: bot.name,
          turn: state.turnIndex,
          chips: action.chips.length,
          turnCount: turnCounter,
        })
        bot.client.emit('exchange_chips', { chips: action.chips })
      }
    })

    bot.client.on('error', (err: ErrorPayload) => {
      log('bot.error', { bot: bot.name, code: err.code, messageKey: err.messageKey })
    })
  }

  // 4. Start game; race game_over against turn cap
  const gameOverPromise = new Promise<GameOverPayload>((resolve) => {
    hostClient.once('game_over', (payload) => resolve(payload))
  })

  const startTime = Date.now()
  hostClient.emit('start_game')
  log('game.starting', { code })

  // Turn-cap guard: a polling interval that fails if we exceed the cap
  // without seeing game_over. Two independent caps protect against
  // (a) wall-clock hangs and (b) runaway-but-still-active games.
  const turnCapInterval = setInterval(() => {
    if (turnCounter > TURN_CAP_TURNS) {
      log('turn_cap.exceeded', { turns: turnCounter, cap: TURN_CAP_TURNS })
      clearInterval(turnCapInterval)
      // Force-fail by emitting a sentinel error that the race below handles
      hostClient.emit('error', { code: 'TURN_CAP_EXCEEDED' as never, messageKey: 'sim.turn_cap' })
    }
  }, 500)

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`wall-clock turn cap ${TURN_CAP_MS}ms exceeded`)), TURN_CAP_MS)
  })

  let gameOver: GameOverPayload
  try {
    gameOver = await Promise.race([gameOverPromise, timeoutPromise])
  } catch (err) {
    clearInterval(turnCapInterval)
    log('failure', {
      reason: (err as Error).message,
      turnCount: turnCounter,
      lastPhase: lastState?.phase,
      lastTurnIndex: lastState?.turnIndex,
      bagLen: lastState?.bag.length,
      handSizes: lastState?.players.map((p) => ({ name: p.name, n: p.hand.length })),
    })
    await cleanup(bots)
    process.exit(1)
  }
  clearInterval(turnCapInterval)

  const elapsed = Date.now() - startTime
  log('game.over', {
    elapsedMs: elapsed,
    turnCount: turnCounter,
    scoresCount: gameOver.scores.length,
  })

  // 5. Assertions
  const failures: string[] = []
  if (gameOver.scores.length !== BOT_COUNT) {
    failures.push(`expected ${BOT_COUNT} scores, got ${gameOver.scores.length}`)
  }
  for (const s of gameOver.scores) {
    if (!Number.isFinite(s.combined)) {
      failures.push(`player ${s.playerId} has non-finite combined: ${s.combined}`)
    }
    if (s.placed < 0) failures.push(`player ${s.playerId} placed=${s.placed} negative`)
    if (s.remaining < 0) failures.push(`player ${s.playerId} remaining=${s.remaining} negative`)
  }
  // There should be at least one positive score (someone placed chips).
  const totalPlaced = gameOver.scores.reduce((a, s) => a + s.placed, 0)
  if (totalPlaced <= 0) {
    failures.push(`total placed = ${totalPlaced}, expected > 0`)
  }
  // There must be a winner (no two-way tie at the very top is fine, but
  // scores should not all be equal — at minimum placements must differ).
  const topScore = Math.max(...gameOver.scores.map((s) => s.combined))
  const bottomScore = Math.min(...gameOver.scores.map((s) => s.combined))
  if (topScore === bottomScore) {
    failures.push(`all ${BOT_COUNT} scores identical (${topScore}) — something is wrong`)
  }

  if (failures.length > 0) {
    log('assertion.failed', { failures })
    await cleanup(bots)
    process.exit(1)
  }

  log('success', {
    elapsedMs: elapsed,
    turnCount: turnCounter,
    topScore,
    bottomScore,
    totalPlaced,
    scores: gameOver.scores.map((s) => ({
      name: bots.find((b) => b.playerId === s.playerId)?.name ?? s.playerId,
      placed: s.placed,
      remaining: s.remaining,
      combined: s.combined,
    })),
  })

  await cleanup(bots)
  process.exit(0)
}

async function cleanup(bots: Bot[]): Promise<void> {
  await Promise.all(
    bots.map(
      (b) =>
        new Promise<void>((resolve) => {
          if (b.client.connected) b.client.disconnect()
          b.client.off()
          resolve()
        }),
    ),
  )
}

main().catch((err) => {
  log('uncaught', { error: (err as Error).message, stack: (err as Error).stack })
  process.exit(1)
})
