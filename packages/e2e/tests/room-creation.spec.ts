import { test, expect } from '@playwright/test'

test.describe('Room Creation Flow', () => {
  test('home screen has create room button and no join button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('home-screen')).toBeVisible()
    await expect(page.getByTestId('btn-create')).toBeVisible()
    await expect(page.getByTestId('btn-join')).toHaveCount(0)
  })

  test('legacy config and join routes redirect to home', async ({ page }) => {
    await page.goto('/config')
    await expect(page.getByTestId('home-screen')).toBeVisible()

    await page.goto('/join')
    await expect(page.getByTestId('home-screen')).toBeVisible()
  })

  test('creates a room and navigates to lobby', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-create').click()
    await expect(page).toHaveURL(/\/room\//, { timeout: 10000 })
    await expect(page.getByTestId('lobby-screen')).toBeVisible()
    const roomCode = page.getByTestId('room-code')
    await expect(roomCode).toBeVisible()
    const code = await roomCode.textContent()
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
  })

  test('copy button copies the room URL', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
    await page.getByTestId('btn-create').click()
    await expect(page.getByTestId('lobby-screen')).toBeVisible()
    await page.getByTestId('btn-copy-code').click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    await expect(page).toHaveURL(/\/room\//)
    expect(copied).toMatch(/\/room\/[A-Z0-9]{6}$/)
  })
})
