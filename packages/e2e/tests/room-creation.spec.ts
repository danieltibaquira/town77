import { test, expect } from '@playwright/test'

test.describe('Room Creation Flow', () => {
  test('config screen has random name pre-filled', async ({ page }) => {
    await page.goto('/config')
    await expect(page.getByTestId('config-screen')).toBeVisible()
    const nameInput = page.getByTestId('input-player-name')
    await expect(nameInput).not.toHaveValue('')
  })

  test('create room button is enabled by default', async ({ page }) => {
    await page.goto('/config')
    await expect(page.getByTestId('btn-create-room')).toBeEnabled()
  })

  test('displays default game settings', async ({ page }) => {
    await page.goto('/config')
    await expect(page.getByTestId('config-grid')).toContainText('7')
    await expect(page.getByTestId('config-colors')).toContainText('7')
    await expect(page.getByTestId('config-shapes')).toContainText('7')
    await expect(page.getByTestId('config-copies')).toContainText('1')
    await expect(page.getByTestId('config-hand-size')).toContainText('4')
    await expect(page.getByTestId('config-total-chips')).toContainText('49')
    await expect(page.getByTestId('config-board-cells')).toContainText('49')
  })

  test('preset Fast 5x5 changes grid settings', async ({ page }) => {
    await page.goto('/config')
    await page.getByTestId('preset-fast').click()
    await expect(page.getByTestId('config-grid')).toContainText('5')
    await expect(page.getByTestId('config-board-cells')).toContainText('25')
  })

  test('shows warning when chips fewer than cells', async ({ page }) => {
    await page.goto('/config')
    // Increase grid to 9x9 (81 cells) with only 49 chips
    const gridInc = page.getByTestId('config-grid').getByTestId('stepper-inc')
    await gridInc.click() // 7->8
    await gridInc.click() // 8->9
    await expect(page.getByTestId('config-warning')).toBeVisible()
  })

  test('creates a room and navigates to lobby', async ({ page }) => {
    await page.goto('/config')
    await page.getByTestId('btn-create-room').click()
    // Should navigate to lobby with room code
    await expect(page).toHaveURL(/\/room\//, { timeout: 10000 })
    await expect(page.getByTestId('lobby-screen')).toBeVisible()
    // Should display a 6-character room code
    const roomCode = page.getByTestId('room-code')
    await expect(roomCode).toBeVisible()
    const code = await roomCode.textContent()
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
  })

  test('theme picker shows available themes', async ({ page }) => {
    await page.goto('/config')
    await expect(page.getByTestId('theme-card-town77')).toBeVisible()
    await expect(page.getByTestId('theme-card-playful-pastel')).toBeVisible()
  })
})
