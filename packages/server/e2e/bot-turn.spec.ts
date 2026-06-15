import { test, expect } from '@playwright/test'
import { findBotAction } from '@town77/game-engine'
import type { GameState } from '@town77/shared-types'

test('bot auto-plays one turn: selects chip and clicks valid cell', async ({ browser }) => {
  const hostPage = await browser.newPage()
  await hostPage.goto('/config')
  await hostPage.getByTestId('input-player-name').fill('Host')
  await hostPage.getByTestId('btn-create-room').click()
  await expect(hostPage.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })
  const code = await hostPage.getByTestId('room-code').textContent()

  const botPage = await browser.newPage()
  await botPage.goto('/join')
  await botPage.getByTestId('input-room-code').fill(code!)
  await botPage.getByTestId('input-join-name').fill('Bot')
  await botPage.getByTestId('btn-join-room').click()
  await expect(botPage.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })

  await hostPage.getByTestId('btn-start-game').click()
  await expect(hostPage.getByTestId('game-screen')).toBeVisible({ timeout: 5000 })
  await expect(botPage.getByTestId('game-screen')).toBeVisible({ timeout: 5000 })

  for (const pg of [hostPage, botPage]) {
    const s = await pg.evaluate(() => {
      const store = (window as any).__store
      return { hasStore: !!store, phase: store?.getState()?.gameState?.phase }
    })
    expect(s.hasStore).toBe(true)
    expect(s.phase).toBe('playing')
  }

  async function autoPlayOnce(page: typeof hostPage): Promise<boolean> {
    const gs: GameState = await page.evaluate(() => (window as any).__store.getState().gameState)
    const pid: string = await page.evaluate(() => (window as any).__store.getState().playerId)

    if (gs.players[gs.turnIndex]?.id !== pid) return false

    const action = findBotAction(gs, pid)
    if (!action || action.type !== 'place') return false

    await page.evaluate(
      ({ color, shape }) => {
        const chips = document.querySelectorAll('[data-color]')
        for (const el of chips) {
          if (el.getAttribute('data-color') === color && el.getAttribute('data-shape') === shape) {
            ;(el as HTMLElement).click()
            break
          }
        }
      },
      { color: action.chip.color, shape: action.chip.shape },
    )
    await page.waitForTimeout(100)
    await page.evaluate(
      ({ row, col }) => {
        const cells = document.querySelectorAll('[data-row]')
        for (const el of cells) {
          if (el.getAttribute('data-row') === String(row) && el.getAttribute('data-col') === String(col)) {
            ;(el as HTMLElement).click()
            break
          }
        }
      },
      { row: action.row, col: action.col },
    )
    return true
  }

  let acted = false
  for (let i = 0; i < 20 && !acted; i++) {
    await hostPage.waitForTimeout(500)
    acted = (await autoPlayOnce(hostPage)) || (await autoPlayOnce(botPage))
  }

  expect(acted).toBe(true)
  await hostPage.close()
  await botPage.close()
})
