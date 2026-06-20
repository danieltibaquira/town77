import { test, expect } from '@playwright/test'

test('host + 1 bot join lobby', async ({ browser }) => {
  const hostPage = await browser.newPage()
  await hostPage.goto('/config')
  await hostPage.getByTestId('input-player-name').fill('Host')
  await hostPage.getByTestId('btn-create-room').click()
  await expect(hostPage.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })
  const code = await hostPage.getByTestId('room-code').textContent()

  const botPage = await browser.newPage()
  await botPage.goto('/join')
  await botPage.getByTestId('input-room-code').fill(code!)
  await botPage.getByTestId('input-join-name').fill('Bot-2')
  await botPage.getByTestId('btn-join-room').click()
  await expect(botPage.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })

  const badges = hostPage.locator('[data-testid^="player-badge-"]')
  await expect(badges).toHaveCount(2)

  await hostPage.close()
  await botPage.close()
})
