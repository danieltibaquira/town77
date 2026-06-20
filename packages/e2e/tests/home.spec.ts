import { test, expect } from '@playwright/test'

test.describe('Home Screen', () => {
  test('displays game title', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Town 77' })).toBeVisible()
  })

  test('has create room button and no join button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('btn-create')).toBeVisible()
    await expect(page.getByTestId('btn-create')).toHaveText('Crear sala')
    await expect(page.getByTestId('btn-join')).toHaveCount(0)
  })

  test('create room goes straight to lobby room URL', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-create').click()
    await expect(page).toHaveURL(/\/room\/[A-Z0-9]{6}$/)
    await expect(page.getByTestId('lobby-screen')).toBeVisible()
  })

  test('legacy config and join routes redirect home', async ({ page }) => {
    await page.goto('/config')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('home-screen')).toBeVisible()

    await page.goto('/join')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('home-screen')).toBeVisible()
  })
})
