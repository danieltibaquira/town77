import { test, expect } from '@playwright/test'

test('host creates room and sees lobby with room code', async ({ page }) => {
  await page.goto('/config')
  await expect(page.getByTestId('config-screen')).toBeVisible()

  await page.getByTestId('input-player-name').fill('HostPlayer')
  await page.getByTestId('btn-create-room').click()

  await expect(page.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('room-code')).toBeVisible()
  const code = await page.getByTestId('room-code').textContent()
  expect(code).toBeTruthy()
  expect(code!.length).toBe(6)
})
