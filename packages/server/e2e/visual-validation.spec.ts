import { test, expect } from '@playwright/test'
import { findBotAction } from '@town77/game-engine'
import type { GameState } from '@town77/shared-types'

test('UI elements validated across 10 turns of gameplay', async ({ browser }) => {
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
  await expect(hostPage.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })
  await expect(botPage.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })

  for (let turn = 0; turn < 10; turn++) {
    for (const p of [hostPage, botPage]) {
      const gs: GameState = await p.evaluate(() => (window as any).__store.getState().gameState)
      const pid: string = await p.evaluate(() => (window as any).__store.getState().playerId)

      if (gs.players[gs.turnIndex]?.id !== pid) continue

      const action = findBotAction(gs, pid)
      if (!action) continue

      if (action.type === 'place') {
        await p.getByTestId(`chip-${action.chip.color}-${action.chip.shape}`).click()
        await p.waitForTimeout(50)
        await p.getByTestId(`cell-${action.row}-${action.col}`).click()
      } else if (action.type === 'discard') {
        await p.getByTestId(`chip-${action.chip.color}-${action.chip.shape}`).click()
        await p.waitForTimeout(50)
        await p.getByTestId('btn-discard').click()
      }

      await p.waitForTimeout(200)

      await expect(p.getByTestId('game-screen')).toBeVisible({ timeout: 3000 })
      await expect(p.getByTestId('turn-indicator')).toBeVisible()
      await expect(p.getByTestId('bag-count')).toBeVisible()
      const bagVal = await p.getByTestId('bag-count').textContent()
      expect(Number(bagVal)).toBeGreaterThanOrEqual(0)
      await expect(p.locator('[data-testid^="player-badge-"]').first()).toBeVisible()
      await expect(p.getByTestId('action-bar')).toBeVisible()
    }

    await hostPage.waitForTimeout(100)
  }

  await hostPage.close()
  await botPage.close()
})
