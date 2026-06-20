import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { findBotAction } from '../game-engine/src/index.ts'
import { computeBoardHash } from './lib/boardHash'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { GameState, Grid, Score } from '../shared-types/src/index.ts'
import type { BotAction } from '../game-engine/src/index.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROD_URL = process.env['TOWN77_PROD_URL'] ?? 'https://town77.fly.dev'
const BOT_COUNT = parseInt(process.env['TOWN77_BOT_COUNT'] ?? '5', 10)
const HEADLESS = process.env['TOWN77_HEADLESS'] !== 'false'
const MAX_TURNS = parseInt(process.env['TOWN77_MAX_TURNS'] ?? '500', 10)
const UI_TIMEOUT_MS = 20000
const TURN_SETTLE_MS = 1000
const ACTION_CLICK_DELAY_MS = 200
const DISCARD_CLICK_DELAY_MS = 50
const STATE_WAIT_MS = 12000

const logger = {
  info: (obj: any, msg?: string) => console.log(JSON.stringify({ level: 'INFO', time: new Date().toISOString(), service: 'prod-5bot', ...obj, msg })),
  error: (obj: any, msg?: string) => console.error(JSON.stringify({ level: 'ERROR', time: new Date().toISOString(), service: 'prod-5bot', ...obj, msg })),
}

interface TurnEntry {
  turn: number
  player: string
  action: BotAction
  scoreDelta: number
  boardStateHash: string
}

interface BotContext {
  index: number
  name: string
  page: Page
  context: BrowserContext
  playerId: string | null
  stateUpdateCount: { value: number }
}

async function getStore(page: Page): Promise<{ gameState: GameState | null; playerId: string | null; scores: Score[] | null; roomCode: string | null }> {
  return page.evaluate(() => {
    const s = (window as any).__store?.getState()
    return {
      gameState: s?.gameState ?? null,
      playerId: s?.playerId ?? null,
      scores: s?.scores ?? null,
      roomCode: s?.roomCode ?? null,
    }
  })
}

function attachStateUpdateCounter(page: Page, stateUpdateCount: { value: number }): void {
  page.on('websocket', ws => {
    ws.on('framereceived', data => {
      const payloadStr = String(data.payload)
      if (payloadStr.includes('"state_update"')) {
        stateUpdateCount.value++
      }
    })
  })
}

async function waitForLobbyReady(page: Page, minimumPlayers = 1): Promise<void> {
  await page.getByTestId('lobby-screen').waitFor({ state: 'visible', timeout: UI_TIMEOUT_MS })
  await page.waitForFunction(
    ({ minimumPlayers }) => {
      const state = (window as any).__store?.getState?.()
      return Boolean(
        state?.playerId &&
          state?.roomCode &&
          state?.gameState?.players?.length >= minimumPlayers,
      )
    },
    { minimumPlayers },
    { timeout: UI_TIMEOUT_MS },
  )
}

async function createRoomFromHome(bot: BotContext): Promise<string> {
  logger.info({ bot: bot.index }, 'creating.room')
  await bot.page.goto(`${PROD_URL}/`)
  await bot.page.getByTestId('home-screen').waitFor({ state: 'visible', timeout: UI_TIMEOUT_MS })
  await bot.page.getByTestId('btn-create').click()
  await waitForLobbyReady(bot.page, 1)

  const roomCode = (await bot.page.getByTestId('room-code').textContent())?.trim()
  if (!roomCode) throw new Error('room code not received')

  logger.info({ roomCode, bot: bot.index }, 'room.created')
  return roomCode
}

async function autoJoinRoomViaUrl(bot: BotContext, roomCode: string): Promise<void> {
  logger.info({ bot: bot.index, roomCode }, 'joining.room')
  await bot.page.goto(`${PROD_URL}/room/${roomCode}`)
  await waitForLobbyReady(bot.page, 2)
  logger.info({ bot: bot.index }, 'bot.joined.lobby')
}

async function waitForStateChange(bot: BotContext, previousTurnIndex: number, previousGrid: string, previousStateUpdateCount: number): Promise<void> {
  await Promise.race([
    bot.page
      .waitForFunction(
        ([prevIdx, prevGrid]: [number, string]) => {
          const gs = (window as any).__store?.getState().gameState
          if (!gs) return false
          if (gs.phase === 'finished') return true
          if (gs.turnIndex !== prevIdx) return true
          return JSON.stringify(gs.grid) !== prevGrid
        },
        [previousTurnIndex, previousGrid] as [number, string],
        { timeout: STATE_WAIT_MS },
      )
      .catch(() => {}),
    new Promise<void>(resolve => {
      const checkInterval = setInterval(() => {
        if (bot.stateUpdateCount.value > previousStateUpdateCount) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, STATE_WAIT_MS)
    }),
  ])
}

async function performAction(bot: BotContext, action: BotAction): Promise<boolean> {
  if (action.type === 'place') {
    const chipSelector = `chip-${action.chip.color}-${action.chip.shape}`
    const cellSelector = `cell-${action.row}-${action.col}`
    const chipExists = (await bot.page.getByTestId(chipSelector).count()) > 0
    const cellExists = (await bot.page.getByTestId(cellSelector).count()) > 0

    if (!chipExists || !cellExists) {
      logger.error({ bot: bot.index, name: bot.name, chipExists, cellExists, msg: 'ui.element.missing' }, 'skip.action')
      return false
    }

    await bot.page.getByTestId(chipSelector).click()
    await bot.page.waitForTimeout(ACTION_CLICK_DELAY_MS)
    await bot.page.getByTestId(cellSelector).click()
    await bot.page.waitForTimeout(ACTION_CLICK_DELAY_MS)
    return true
  }

  if (action.type === 'discard') {
    await bot.page.getByTestId(`chip-${action.chip.color}-${action.chip.shape}`).click()
    await bot.page.waitForTimeout(DISCARD_CLICK_DELAY_MS)
    await bot.page.getByTestId('btn-discard').click()
    return true
  }

  if (action.type === 'exchange') {
    const chip = action.chips[0]
    if (!chip) return false
    await bot.page.getByTestId(`chip-${chip.color}-${chip.shape}`).first().click()
    await bot.page.waitForTimeout(DISCARD_CLICK_DELAY_MS)
    await bot.page.getByTestId('btn-exchange').click()
    return true
  }

  return false
}

async function main(): Promise<void> {
  const roomName = `prod-probe-${Date.now()}`
  logger.info({ roomName, botCount: BOT_COUNT, maxTurns: MAX_TURNS, prodUrl: PROD_URL }, 'game.init')

  const browser: Browser = await chromium.launch({ headless: HEADLESS })

  try {
    const bots: BotContext[] = []

    for (let i = 0; i < BOT_COUNT; i++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      const stateUpdateCount = { value: 0 }
      attachStateUpdateCounter(page, stateUpdateCount)

      bots.push({
        index: i,
        name: i === 0 ? 'Host' : `Bot${i + 1}`,
        page,
        context,
        playerId: null,
        stateUpdateCount,
      })
    }

    const host = bots[0]!
    const roomCode = await createRoomFromHome(host)

    for (let i = 1; i < BOT_COUNT; i++) {
      await autoJoinRoomViaUrl(bots[i]!, roomCode)
    }

    await host.page.locator('[data-testid^="player-badge-"]').nth(BOT_COUNT - 1).waitFor({ state: 'visible', timeout: UI_TIMEOUT_MS })

    for (const bot of bots) {
      const { playerId } = await getStore(bot.page)
      bot.playerId = playerId
      logger.info({ bot: bot.index, playerId }, 'player.id.captured')
    }

    logger.info({ roomCode }, 'starting.game')
    await host.page.getByTestId('btn-start-game').click()

    for (const bot of bots) {
      await bot.page.getByTestId('game-screen').waitFor({ state: 'visible', timeout: UI_TIMEOUT_MS })
    }
    logger.info({ roomCode }, 'game.running')

    await host.page.waitForTimeout(2000)

    const turnLog: TurnEntry[] = []
    let gameTurn = 0
    let gameOver = false

    for (let iter = 0; iter < MAX_TURNS && !gameOver; iter++) {
      let anyActed = false

      for (const bot of bots) {
        const storeBefore = await getStore(bot.page)
        if (!storeBefore.gameState || storeBefore.gameState.phase !== 'playing') continue

        const playerId = storeBefore.playerId
        if (!playerId) continue

        const currentTurnPlayerId = storeBefore.gameState.players[storeBefore.gameState.turnIndex]?.id
        if (currentTurnPlayerId !== playerId) continue

        const action = findBotAction(storeBefore.gameState, playerId)
        if (!action) continue

        const acted = await performAction(bot, action)
        if (!acted) continue
        anyActed = true

        const previousTurnIndex = storeBefore.gameState.turnIndex
        const previousGrid = JSON.stringify(storeBefore.gameState.grid)
        const previousStateUpdateCount = bot.stateUpdateCount.value

        await waitForStateChange(bot, previousTurnIndex, previousGrid, previousStateUpdateCount)
        await bot.page.waitForTimeout(TURN_SETTLE_MS)

        const storeAfter = await getStore(bot.page)
        if (storeAfter.gameState?.phase === 'finished') {
          gameOver = true
        }

        const grid = storeAfter.gameState?.grid ?? null
        const hash = grid ? computeBoardHash(grid) : ''
        const playerBefore = storeBefore.gameState.players.find(player => player.id === playerId)
        const playerAfter = storeAfter.gameState?.players.find(player => player.id === playerId)
        const scoreDelta = (playerAfter?.placed ?? 0) - (playerBefore?.placed ?? 0)

        turnLog.push({ turn: gameTurn, player: bot.name, action, scoreDelta, boardStateHash: hash })
        logger.info({ turn: gameTurn, player: bot.name, type: action.type, scoreDelta }, 'turn.played')
        gameTurn++
        break
      }

      if (gameOver) break

      const phase: string | undefined = await host.page.evaluate(() => (window as any).__store?.getState().gameState?.phase)
      if (phase === 'finished') {
        gameOver = true
        break
      }

      if (!anyActed) await host.page.waitForTimeout(100)
    }

    const turn = gameTurn

    if (!gameOver) throw new Error(`game did not finish within ${MAX_TURNS} iterations`)

    const { scores } = await getStore(host.page)
    if (!scores || scores.length !== BOT_COUNT) {
      throw new Error(`expected ${BOT_COUNT} scores, got ${scores?.length ?? 0}`)
    }

    for (const score of scores) {
      if (isNaN(score.combined)) throw new Error(`NaN score for ${score.name}`)
    }

    const finalHashes: string[] = []
    for (const bot of bots) {
      const grid = (await bot.page.evaluate(() => (window as any).__store?.getState().gameState?.grid ?? null)) as Grid | null
      if (!grid) throw new Error(`no grid for bot ${bot.name}`)
      finalHashes.push(computeBoardHash(grid))
    }

    const uniqueHashes = new Set(finalHashes)
    if (uniqueHashes.size !== 1) {
      throw new Error(`hash divergence: ${[...uniqueHashes].join(' | ')}`)
    }

    const finalHash = finalHashes[0]!
    logger.info({ roomCode, turns: turn, scores, finalHash }, 'game.over.verified')

    const artifactDir = join(__dirname, '../artifacts/prod-bots')
    mkdirSync(artifactDir, { recursive: true })
    const artifactPath = join(artifactDir, `${roomName}.json`)
    writeFileSync(
      artifactPath,
      JSON.stringify({ roomName, roomCode, turns: turn, scores, finalHash, hashConsistent: true, turnLog }, null, 2),
    )
    logger.info({ artifactPath }, 'artifact.written')

    process.stdout.write(
      `PASS | room=${roomCode} turns=${turn} players=${scores.map(score => `${score.name}:${score.combined}`).join(',')} hash=${finalHash.slice(0, 8)}...\n`,
    )
    process.exit(0)
  } catch (err) {
    logger.error({ error: (err as Error).message, stack: (err as Error).stack }, 'game.failed')
    process.stdout.write(`FAIL | ${(err as Error).message}\n`)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
