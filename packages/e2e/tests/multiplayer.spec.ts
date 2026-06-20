import { test, expect } from '@playwright/test'

test.describe('Multiplayer Game Flow', () => {
  test('two players can join and start a game', async ({ browser }) => {
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await page1.goto('/')
    await page1.getByTestId('btn-create').click()
    await expect(page1.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const roomCode = await page1.getByTestId('room-code').textContent()
    expect(roomCode).toBeTruthy()

    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    await page2.goto(`/room/${roomCode}`)
    await expect(page2.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })

    await expect(page1.locator('[data-testid^="player-badge-"]')).toHaveCount(2, { timeout: 15000 })
    await expect(page2.locator('[data-testid^="player-badge-"]')).toHaveCount(2, { timeout: 15000 })

    await expect(page1.getByTestId('btn-start-game')).toBeEnabled()
    await page1.getByTestId('btn-start-game').click()

    await expect(page1.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })
    await expect(page2.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })
    await expect(page1.getByTestId('grid')).toBeVisible()
    await expect(page2.getByTestId('grid')).toBeVisible()
    await expect(page1.getByTestId('hand')).toBeVisible()
    await expect(page2.getByTestId('hand')).toBeVisible()

    await context1.close()
    await context2.close()
  })

  test('player can select and place a chip', async ({ browser }) => {
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()

    await page1.goto('/')
    await page1.getByTestId('btn-create').click()
    await expect(page1.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const roomCode = await page1.getByTestId('room-code').textContent()

    await page2.goto(`/room/${roomCode}`)
    await expect(page2.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })

    await expect(page1.locator('[data-testid^="player-badge-"]')).toHaveCount(2, { timeout: 15000 })

    await page1.getByTestId('btn-start-game').click()
    await expect(page1.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })

    const turnText = await page1.getByTestId('turn-indicator').textContent()
    const isMyTurn = turnText?.includes('turno')

    if (isMyTurn) {
      const handChips = page1.getByTestId('hand').locator('[data-testid^="chip-"]')
      const chipCount = await handChips.count()
      expect(chipCount).toBeGreaterThan(0)
      await handChips.first().click()

      const validCells = page1.locator('[data-valid="true"]').filter({ hasNot: page1.locator('[data-testid^="chip-"]') })
      const validCount = await validCells.count()

      if (validCount > 0) {
        await validCells.first().click()
        const gridChips = page1.getByTestId('grid').locator('[data-testid^="chip-"]')
        await expect(gridChips.first()).toBeVisible({ timeout: 5000 })
      }
    }

    await context1.close()
    await context2.close()
  })

  test('room code is copyable', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
    await page.getByTestId('btn-create').click()
    await expect(page.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })

    await expect(page.getByTestId('btn-copy-code')).toBeVisible()
    await expect(page.getByTestId('room-code')).toBeVisible()
    await page.getByTestId('btn-copy-code').click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toMatch(/\/room\/[A-Z0-9]{6}$/)
  })

  test('non-host cannot start game', async ({ browser }) => {
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()

    await page1.goto('/')
    await page1.getByTestId('btn-create').click()
    await expect(page1.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const roomCode = await page1.getByTestId('room-code').textContent()

    await page2.goto(`/room/${roomCode}`)
    await expect(page2.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })

    await expect(page2.locator('[data-testid="btn-start-game"]')).toHaveCount(0)

    await context1.close()
    await context2.close()
  })

  test('session recovery after page reload', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-create').click()
    await expect(page.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const roomCode = await page.getByTestId('room-code').textContent()

    await page.reload()

    await expect(page.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const recoveredCode = await page.getByTestId('room-code').textContent()
    expect(recoveredCode).toBe(roomCode)
  })
})
