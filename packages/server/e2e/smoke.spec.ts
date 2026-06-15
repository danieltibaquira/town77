import { test, expect } from '@playwright/test'

test('smoke: HomeScreen renders with Town 77 title', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-screen')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Town 77' })).toBeVisible()
})

test('smoke: navigate to ConfigScreen via Create Room button', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('btn-create').click()
  await expect(page.getByTestId('config-screen')).toBeVisible()
  await expect(page.getByTestId('input-player-name')).toBeVisible()
})
