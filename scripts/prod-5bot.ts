import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import pino from 'pino'
import { findBotAction } from '../packages/game-engine/src/index.ts'
import { computeBoardHash } from './lib/boardHash'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { GameState, Grid, Score } from '../packages/shared-types/src/index.ts'
import type { BotAction } from '../packages/game-engine/src/index.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROD_URL = process.env['TOWN77_PROD_URL'] ?? 'https://town77.fly.dev'
const BOT_COUNT = parseInt(process.env['TOWN77_BOT_COUNT'] ?? '5', 10)
const HEADLESS = process.env['TOWN77_HEADLESS'] !== 'false'
const MAX_TURNS = parseInt(process.env['TOWN77_MAX_TURNS'] ?? '500', 10)

const logger = pino({
  level: 'info',
  base: { service: 'prod-5bot' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label.toUpperCase() }) },
})

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
}

async function getStore(page: Page): Promise<{ gameState: GameState | null; playerId: string | null; scores: Score[] | null }> {
  return page.evaluate(() => {
    const s = (window as any).__store?.getState()
    return {
      gameState: s?.gameState ?? null,
      playerId: s?.playerId ?? null,
      scores: s?.scores ?? null,
    }
  })
}


async function main(): Promise<void> {
  const roomName = `prod-probe-${Date.now()}`
  logger.info({ roomName, botCount: BOT_COUNT, maxTurns: MAX_TURNS, prodUrl: PROD_URL }, 'game.init')

  const browser: Browser = await chromium.launch({ headless: HEADLESS })

  try {
    const bots: BotContext[] = []

    for (let i = 0; i < BOT_COUNT; i++) {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()
      bots.push({
        index: i,
        name: i === 0 ? `Host` : `Bot${i + 1}`,
        page,
        context: ctx,
        playerId: null,
      })
    }

    const host = bots[0]!

    // Bot 0: create room
    logger.info({ bot: 0 }, 'creating.room')
    await host.page.goto(`${PROD_URL}/config`)
    await host.page.getByTestId('config-screen').waitFor({ state: 'visible', timeout: 20000 })

    const nameInput = host.page.getByTestId('input-player-name')
    await nameInput.clear()
    await nameInput.fill(host.name)
    await host.page.getByTestId('btn-create-room').click()
    await host.page.getByTestId('lobby-screen').waitFor({ state: 'visible', timeout: 20000 })

    const roomCode = await host.page.getByTestId('room-code').textContent()
    if (!roomCode?.trim()) throw new Error('room code not received')
    logger.info({ roomCode, bot: 0 }, 'room.created')

    // Bots 1-N: join room
    for (let i = 1; i < BOT_COUNT; i++) {
      const bot = bots[i]!
      logger.info({ bot: i, roomCode }, 'joining.room')
      await bot.page.goto(`${PROD_URL}/join`)
      await bot.page.getByTestId('join-screen').waitFor({ state: 'visible', timeout: 20000 })
      await bot.page.getByTestId('input-room-code').fill(roomCode.trim())
      await bot.page.getByTestId('input-join-name').fill(bot.name)
      await bot.page.getByTestId('btn-join-room').click()
      await bot.page.getByTestId('lobby-screen').waitFor({ state: 'visible', timeout: 20000 })
      logger.info({ bot: i }, 'bot.joined.lobby')
    }

    // Wait for host to see all players
    await host.page
      .locator('[data-testid^="player-badge-"]')
      .nth(BOT_COUNT - 1)
      .waitFor({ state: 'visible', timeout: 20000 })

    // Capture player IDs
    for (const bot of bots) {
      const { playerId } = await getStore(bot.page)
      bot.playerId = playerId
      logger.info({ bot: bot.index, playerId }, 'player.id.captured')
    }

    // Host starts game
    logger.info({ roomCode }, 'starting.game')
    await host.page.getByTestId('btn-start-game').click()

    for (const bot of bots) {
      await bot.page.getByTestId('game-screen').waitFor({ state: 'visible', timeout: 20000 })
    }
    logger.info({ roomCode }, 'game.running')

    const turnLog: TurnEntry[] = []
    let gameTurn = 0
    let gameOver = false

    for (let iter = 0; iter < MAX_TURNS && !gameOver; iter++) {
      let anyActed = false

      for (const bot of bots) {
        const storeBefore = await getStore(bot.page)
        if (!storeBefore.gameState || storeBefore.gameState.phase !== 'playing') continue
        const pid = storeBefore.playerId
        if (!pid) continue
        if (storeBefore.gameState.players[storeBefore.gameState.turnIndex]?.id !== pid) continue

        // This bot is the current player — find and perform action
        const action = findBotAction(storeBefore.gameState, pid)
        if (!action) continue

        let acted = false
        if (action.type === 'place') {
          await bot.page.getByTestId(`chip-${action.chip.color}-${action.chip.shape}`).click()
          await bot.page.waitForTimeout(50)
          await bot.page.getByTestId(`cell-${action.row}-${action.col}`).click()
          acted = true
        } else if (action.type === 'discard') {
          await bot.page.getByTestId(`chip-${action.chip.color}-${action.chip.shape}`).click()
          await bot.page.waitForTimeout(50)
          await bot.page.getByTestId('btn-discard').click()
          acted = true
        } else if (action.type === 'exchange') {
          const chip = action.chips[0]
          if (chip) {
            await bot.page.getByTestId(`chip-${chip.color}-${chip.shape}`).first().click()
            await bot.page.waitForTimeout(50)
            await bot.page.getByTestId('btn-exchange').click()
            acted = true
          }
        }

        if (!acted) continue
        anyActed = true

        // Wait for state to actually change — handles prod latency
        const prevTurnIdx = storeBefore.gameState.turnIndex
        const prevGridStr = JSON.stringify(storeBefore.gameState.grid)
        await bot.page
          .waitForFunction(
            ([prevIdx, prevGrid]: [number, string]) => {
              const gs = (window as any).__store?.getState().gameState
              if (!gs) return false
              if (gs.phase === 'finished') return true
              if (gs.turnIndex !== prevIdx) return true
              return JSON.stringify(gs.grid) !== prevGrid
            },
            [prevTurnIdx, prevGridStr] as [number, string],
            { timeout: 12000 },
          )
          .catch(() => {})

        const storeAfter = await getStore(bot.page)
        if (storeAfter.gameState?.phase === 'finished') {
          gameOver = true
        }

        const grid = storeAfter.gameState?.grid ?? null
        const hash = grid ? computeBoardHash(grid) : ''
        const playerBefore = storeBefore.gameState.players.find(p => p.id === pid)
        const playerAfter = storeAfter.gameState?.players.find(p => p.id === pid)
        const scoreDelta = (playerAfter?.placed ?? 0) - (playerBefore?.placed ?? 0)

        turnLog.push({ turn: gameTurn, player: bot.name, action, scoreDelta, boardStateHash: hash })
        logger.info({ turn: gameTurn, player: bot.name, type: action.type, scoreDelta }, 'turn.played')
        gameTurn++
        break
      }

      if (gameOver) break

      const phase: string | undefined = await host.page.evaluate(
        () => (window as any).__store?.getState().gameState?.phase,
      )
      if (phase === 'finished') {
        gameOver = true
        break
      }

      if (!anyActed) await host.page.waitForTimeout(100)
    }

    const turn = gameTurn

    if (!gameOver) throw new Error(`game did not finish within ${MAX_TURNS} iterations`)

    // Collect scores
    const { scores } = await getStore(host.page)
    if (!scores || scores.length !== BOT_COUNT) {
      throw new Error(`expected ${BOT_COUNT} scores, got ${scores?.length ?? 0}`)
    }

    for (const s of scores) {
      if (isNaN(s.combined)) throw new Error(`NaN score for ${s.name}`)
    }

    // Verify hash consistency across all 5 bots
    const finalHashes: string[] = []
    for (const bot of bots) {
      const grid = await bot.page.evaluate(
        () => (window as any).__store?.getState().gameState?.grid ?? null,
      ) as Grid | null
      if (!grid) throw new Error(`no grid for bot ${bot.name}`)
      finalHashes.push(computeBoardHash(grid))
    }

    const uniqueHashes = new Set(finalHashes)
    if (uniqueHashes.size !== 1) {
      throw new Error(`hash divergence: ${[...uniqueHashes].join(' | ')}`)
    }

    const finalHash = finalHashes[0]!
    logger.info({ roomCode, turns: turn, scores, finalHash }, 'game.over.verified')

    // Write artifact
    const artifactDir = join(__dirname, '../artifacts/prod-bots')
    mkdirSync(artifactDir, { recursive: true })
    const artifactPath = join(artifactDir, `${roomName}.json`)
    writeFileSync(
      artifactPath,
      JSON.stringify(
        { roomName, roomCode, turns: turn, scores, finalHash, hashConsistent: true, turnLog },
        null,
        2,
      ),
    )
    logger.info({ artifactPath }, 'artifact.written')

    process.stdout.write(
      `PASS | room=${roomCode} turns=${turn} players=${scores.map(s => `${s.name}:${s.combined}`).join(',')} hash=${finalHash.slice(0, 8)}...\n`,
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
