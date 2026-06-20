import { test, expect } from '@playwright/test'

test('5 players (1 host + 4 bots) join lobby and start game', async ({ browser }) => {
  const hostPage = await browser.newPage()
  await hostPage.goto('/config')
  await hostPage.getByTestId('input-player-name').fill('Host')
  await hostPage.getByTestId('btn-create-room').click()
  await expect(hostPage.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })
  const code = await hostPage.getByTestId('room-code').textContent()

  const botPages = await Promise.all(
    [2, 3, 4, 5].map(async (n) => {
      const botPage = await browser.newPage()
      await botPage.goto('/join')
      await expect(botPage.getByTestId('input-room-code')).toBeVisible()
      await botPage.getByTestId('input-room-code').fill(code!)
      await botPage.getByTestId('input-join-name').fill(`Bot-${n}`)
      await botPage.getByTestId('btn-join-room').click()
      await expect(botPage.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })
      return botPage
    }),
  )

  await expect(hostPage.getByTestId('lobby-screen')).toBeVisible()
  const badges = hostPage.locator('[data-testid^="player-badge-"]')
  await expect(badges).toHaveCount(5)

  for (const bp of botPages) await bp.close()
  await hostPage.close()
})
