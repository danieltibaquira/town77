import { expect, test } from '@playwright/test'

test.describe('Multiplayer Game Flow', () => {
  test('two players can join and start a game', async ({ browser }) => {
    // Player 1 creates room
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await page1.goto('/config')
    await page1.getByTestId('btn-create-room').click()
    await expect(page1.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const roomCode = await page1.getByTestId('room-code').textContent()
    expect(roomCode).toBeTruthy()

    // Player 2 joins room
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    await page2.goto('/join')
    await page2.getByTestId('input-room-code').fill(roomCode!)
    await page2.getByTestId('btn-join-room').click()
    await expect(page2.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })

    // Both players should see each other
    await expect(page1.locator('[data-testid^="player-badge-"]')).toHaveCount(2, {
      timeout: 15000,
    })
    await expect(page2.locator('[data-testid^="player-badge-"]')).toHaveCount(2, {
      timeout: 15000,
    })

    // Player 1 (host) starts game
    await expect(page1.getByTestId('btn-start-game')).toBeEnabled()
    await page1.getByTestId('btn-start-game').click()

    // Both players should be in game screen
    await expect(page1.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })
    await expect(page2.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })

    // Both should see the grid and hand
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

    // Create and join room, start game
    await page1.goto('/config')
    await page1.getByTestId('btn-create-room').click()
    await expect(page1.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const roomCode = await page1.getByTestId('room-code').textContent()

    await page2.goto('/join')
    await page2.getByTestId('input-room-code').fill(roomCode!)
    await page2.getByTestId('btn-join-room').click()
    await expect(page2.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })

    // Wait for both players to see each other before starting
    await expect(page1.locator('[data-testid^="player-badge-"]')).toHaveCount(2, {
      timeout: 15000,
    })

    await page1.getByTestId('btn-start-game').click()
    await expect(page1.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })

    // Determine whose turn it is
    const turnText = await page1.getByTestId('turn-indicator').textContent()
    const isMyTurn = turnText?.includes('turno')

    if (isMyTurn) {
      // Click a chip in hand to select it
      const handChips = page1.getByTestId('hand').locator('[data-testid^="chip-"]')
      const chipCount = await handChips.count()
      expect(chipCount).toBeGreaterThan(0)
      await handChips.first().click()

      // Valid cells should be highlighted
      const validCells = page1
        .locator('[data-valid="true"]')
        .filter({ hasNot: page1.locator('[data-testid^="chip-"]') })
      const validCount = await validCells.count()

      if (validCount > 0) {
        // Click first valid cell
        await validCells.first().click()
        // A chip should now appear on the grid
        const gridChips = page1.getByTestId('grid').locator('[data-testid^="chip-"]')
        await expect(gridChips.first()).toBeVisible({ timeout: 5000 })
      }
    }

    await context1.close()
    await context2.close()
  })

  test('room code is copyable', async ({ page }) => {
    await page.goto('/config')
    await page.getByTestId('btn-create-room').click()
    await expect(page.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })

    await expect(page.getByTestId('btn-copy-code')).toBeVisible()
    await expect(page.getByTestId('room-code')).toBeVisible()
  })

  test('non-host cannot start game', async ({ browser }) => {
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()

    // Player 1 creates room
    await page1.goto('/config')
    await page1.getByTestId('btn-create-room').click()
    await expect(page1.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const roomCode = await page1.getByTestId('room-code').textContent()

    // Player 2 joins
    await page2.goto('/join')
    await page2.getByTestId('input-room-code').fill(roomCode!)
    await page2.getByTestId('btn-join-room').click()
    await expect(page2.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })

    // Player 2 should NOT see start button
    await expect(page2.locator('[data-testid="btn-start-game"]')).toBeHidden()

    await context1.close()
    await context2.close()
  })

  test('session recovery after page reload', async ({ page }) => {
    // Create a room
    await page.goto('/config')
    await page.getByTestId('btn-create-room').click()
    await expect(page.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const roomCode = await page.getByTestId('room-code').textContent()

    // Reload the page
    await page.reload()

    // Should recover and show lobby again
    await expect(page.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const recoveredCode = await page.getByTestId('room-code').textContent()
    expect(recoveredCode).toBe(roomCode)
  })
})
