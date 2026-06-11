import * as fs from 'fs'
import * as path from 'path'
import { type Browser, type Page, expect, test } from '@playwright/test'

interface Player {
  page: Page
  name: string
  consoleLogs: Array<{ type: string; text: string; timestamp: string }>
  pageErrors: Array<{ message: string; timestamp: string }>
}

const SIMULATION_SEED = 42
const PLAYER_COUNT = 5
const SIMULATION_TIMEOUT = 120000 // 2 minutes

async function createPlayer(
  context: ReturnType<Browser['newContext']>,
  name: string,
): Promise<Player> {
  const page = await context.newPage()

  const consoleLogs: Array<{ type: string; text: string; timestamp: string }> = []
  const pageErrors: Array<{ message: string; timestamp: string }> = []

  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text(), timestamp: new Date().toISOString() })
  })
  page.on('pageerror', (err) => {
    pageErrors.push({ message: err.message, timestamp: new Date().toISOString() })
  })

  return { page, name, consoleLogs, pageErrors }
}

async function takeScreenshot(player: Player, label: string, resultsDir: string) {
  const screenshotPath = path.join(resultsDir, 'screenshots', `${player.name}-${label}.png`)
  await player.page.screenshot({ path: screenshotPath, fullPage: false })
}

async function savePlayerLogs(player: Player, resultsDir: string) {
  const logsPath = path.join(resultsDir, 'console-logs', `${player.name}-console.json`)
  const errorsPath = path.join(resultsDir, 'console-logs', `${player.name}-errors.json`)
  fs.writeFileSync(logsPath, JSON.stringify(player.consoleLogs, null, 2))
  fs.writeFileSync(errorsPath, JSON.stringify(player.pageErrors, null, 2))
}

test.describe('5-Player Full Game Simulation', () => {
  test('complete game with deterministic seed', async ({ browser }) => {
    test.setTimeout(SIMULATION_TIMEOUT)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const resultsDir = path.join(__dirname, '..', 'simulation-results', `simulation-${timestamp}`)
    fs.mkdirSync(path.join(resultsDir, 'screenshots'), { recursive: true })
    fs.mkdirSync(path.join(resultsDir, 'console-logs'), { recursive: true })

    // ── Single browser context with 5 pages (fast) ──
    const context = await browser.newContext()
    const players: Player[] = []
    for (let i = 0; i < PLAYER_COUNT; i++) {
      players.push(await createPlayer(context, `Player-${i + 1}`))
    }

    // ── Player 1 creates room with seed ──
    const host = players[0]
    await host.page.goto(`/config?seed=${SIMULATION_SEED}`)
    await expect(host.page.getByTestId('config-screen')).toBeVisible()

    // Use fast 5x5 preset for faster simulation
    await host.page.getByTestId('preset-fast').click()
    await host.page.getByTestId('btn-create-room').click()

    await expect(host.page.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const roomCode = await host.page.getByTestId('room-code').textContent()
    expect(roomCode).toBeTruthy()
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/)

    await takeScreenshot(host, 'lobby-host', resultsDir)

    // ── Players 2-5 join ──
    for (let i = 1; i < PLAYER_COUNT; i++) {
      const p = players[i]
      await p.page.goto('/join')
      await expect(p.page.getByTestId('join-screen')).toBeVisible()
      // Clear previous session data so LobbyScreen auto-rejoin doesn't fire with host's token
      await p.page.evaluate(() => {
        localStorage.removeItem('sessionToken')
        localStorage.removeItem('playerId')
        localStorage.removeItem('roomCode')
      })
      await p.page.getByTestId('input-room-code').fill(roomCode!)
      await p.page.getByTestId('btn-join-room').click()
      await expect(p.page.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    }

    // ── Verify all players in lobby ──
    for (const p of players) {
      await expect(p.page.locator('[data-testid^="player-badge-"]')).toHaveCount(PLAYER_COUNT, {
        timeout: 15000,
      })
    }

    // ── Host starts game ──
    await host.page.getByTestId('btn-start-game').click()

    // ── Wait for all players to see game screen ──
    for (const p of players) {
      await expect(p.page.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })
    }

    // Wait for state_update to sync turn indicator
    await host.page.waitForTimeout(2000)

    await takeScreenshot(host, 'game-start', resultsDir)

    // ── Game loop (5 turns for partial game) ──
    let turnCount = 0
    const maxTurns = 5
    const gameLog: Array<{
      turn: number
      player: string
      action: string
      chip?: string
      position?: [number, number]
      timestamp: string
    }> = []

    for (let turn = 0; turn < maxTurns; turn++) {
      turnCount++

      // Find active player (whose turn indicator says "Tu turno")
      let activePlayer: Player | null = null
      for (const p of players) {
        const turnText = await p.page.getByTestId('turn-indicator').textContent()
        if (turnText?.includes('turno')) {
          activePlayer = p
          break
        }
      }

      if (!activePlayer) {
        break
      }

      const p = activePlayer
      const page = p.page

      // Try to place a chip
      let placed = false
      const handChips = page.getByTestId('hand').locator('[data-testid^="chip-"]')
      const chipCount = await handChips.count()

      for (let i = 0; i < chipCount; i++) {
        await handChips.nth(i).click()
        await page.waitForTimeout(100)

        const validCells = page.locator('[data-testid^="cell-"][data-valid="true"]')
        const validCount = await validCells.count()

        if (validCount > 0) {
          const chipTestId = await handChips.nth(i).getAttribute('data-testid')
          const cellTestId = await validCells.first().getAttribute('data-testid')
          await validCells.first().click()
          placed = true

          gameLog.push({
            turn: turnCount,
            player: p.name,
            action: 'placed',
            chip: chipTestId ?? 'unknown',
            position: parseCellId(cellTestId ?? ''),
            timestamp: new Date().toISOString(),
          })
          break
        }
      }

      if (!placed) {
        const exchanged = await tryExchange(page)
        if (exchanged) {
          gameLog.push({
            turn: turnCount,
            player: p.name,
            action: 'exchanged',
            timestamp: new Date().toISOString(),
          })
        } else {
          const discarded = await tryDiscard(page)
          if (discarded) {
            gameLog.push({
              turn: turnCount,
              player: p.name,
              action: 'discarded',
              timestamp: new Date().toISOString(),
            })
          } else {
            await page.keyboard.press('Escape')
            gameLog.push({
              turn: turnCount,
              player: p.name,
              action: 'passed',
              timestamp: new Date().toISOString(),
            })
          }
        }
      }

      await page.waitForTimeout(500)
      await takeScreenshot(p, `turn-${turnCount}`, resultsDir)
    }

    // ── Partial game end — capture state ──
    await takeScreenshot(host, 'partial-end', resultsDir)

    // ── Save artifacts ──
    const summary = {
      simulation: {
        timestamp,
        seed: SIMULATION_SEED,
        players: PLAYER_COUNT,
        turns: turnCount,
        grid: '5x5',
        durationMs: Date.now() - new Date(timestamp).getTime(),
      },
      gameLog,
      artifacts: {
        screenshots: path.join(resultsDir, 'screenshots'),
        consoleLogs: path.join(resultsDir, 'console-logs'),
      },
    }

    fs.writeFileSync(
      path.join(resultsDir, 'simulation-summary.json'),
      JSON.stringify(summary, null, 2),
    )

    for (const p of players) {
      await savePlayerLogs(p, resultsDir)
    }

    // ── Save server logs (if running in docker) ──
    try {
      const { execSync } = require('child_process')
      const serverLogs = execSync('docker compose logs server --no-color --tail=500', {
        cwd: path.join(__dirname, '..', '..'),
        encoding: 'utf-8',
      })
      fs.writeFileSync(path.join(resultsDir, 'server-logs.jsonl'), serverLogs)
    } catch {
      // Server might not be running in docker
    }

    // ── Verify ──
    expect(turnCount).toBeGreaterThan(0)
    expect(gameLog.length).toBeGreaterThan(0)

    // ── Cleanup ──
    await context.close()
  })
})

// Helper: parse cell data-testid like "cell-3-4" into [3, 4]
function parseCellId(testId: string): [number, number] {
  const match = testId.match(/cell-(\d+)-(\d+)/)
  if (!match) return [0, 0]
  return [Number.parseInt(match[1], 10), Number.parseInt(match[2], 10)]
}

// Helper: try exchange (3 chips of same color)
async function tryExchange(page: Page): Promise<boolean> {
  const handChips = page.getByTestId('hand').locator('[data-testid^="chip-"]')
  const count = await handChips.count()
  if (count < 3) return false

  const chips: Array<{ index: number; color: string; shape: string }> = []
  for (let i = 0; i < count; i++) {
    const testId = await handChips.nth(i).getAttribute('data-testid')
    const match = testId?.match(/chip-(color-\d+)-(.+)/)
    if (match) {
      chips.push({ index: i, color: match[1], shape: match[2] })
    }
  }

  const byColor = new Map<string, number[]>()
  for (const chip of chips) {
    const arr = byColor.get(chip.color) ?? []
    arr.push(chip.index)
    byColor.set(chip.color, arr)
  }

  for (const [_color, indices] of byColor) {
    if (indices.length >= 3) {
      for (const idx of indices.slice(0, 3)) {
        await handChips.nth(idx).click()
        await page.waitForTimeout(100)
      }
      const exchangeBtn = page.getByTestId('btn-exchange')
      if (await exchangeBtn.isEnabled().catch(() => false)) {
        await exchangeBtn.click()
        return true
      }
      await page.keyboard.press('Escape')
    }
  }

  return false
}

// Helper: try discard
async function tryDiscard(page: Page): Promise<boolean> {
  const handChips = page.getByTestId('hand').locator('[data-testid^="chip-"]')
  const count = await handChips.count()
  if (count === 0) return false

  await handChips.first().click()
  await page.waitForTimeout(100)

  const discardBtn = page.getByTestId('btn-discard')
  if (await discardBtn.isEnabled().catch(() => false)) {
    await discardBtn.click()
    return true
  }

  await page.keyboard.press('Escape')
  return false
}
