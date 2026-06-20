import { test, expect } from '@playwright/test'

test('5 players start game and see game screen', async ({ browser }) => {
  const hostPage = await browser.newPage()
  await hostPage.goto('/config')
  await hostPage.getByTestId('input-player-name').fill('Host')
  await hostPage.getByTestId('btn-create-room').click()
  await expect(hostPage.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })
  const code = await hostPage.getByTestId('room-code').textContent()

  const botPages = await Promise.all(
    [2, 3, 4, 5].map(async (n) => {
      const bp = await browser.newPage()
      await bp.goto('/join')
      await bp.getByTestId('input-room-code').fill(code!)
      await bp.getByTestId('input-join-name').fill(`Bot-${n}`)
      await bp.getByTestId('btn-join-room').click()
      await expect(bp.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })
      return bp
    }),
  )

  await hostPage.getByTestId('btn-start-game').click()

  await expect(hostPage.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })
  for (const bp of botPages) {
    await expect(bp.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })
    await bp.close()
  }
  await hostPage.close()
})
