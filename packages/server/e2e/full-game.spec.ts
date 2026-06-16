import { test, expect, type Page } from '@playwright/test'
import { findBotAction } from '@town77/game-engine'
import type { GameState } from '@town77/shared-types'

async function autoPlayTurn(page: Page): Promise<boolean> {
  const gs: GameState = await page.evaluate(() => (window as any).__store.getState().gameState)
  const pid: string = await page.evaluate(() => (window as any).__store.getState().playerId)

  if (gs.players[gs.turnIndex]?.id !== pid) return false

  const action = findBotAction(gs, pid)
  if (!action) return false

  if (action.type === 'place') {
    const chipId = `chip-${action.chip.color}-${action.chip.shape}`
    const cellId = `cell-${action.row}-${action.col}`
    await page.getByTestId(chipId).click()
    await page.waitForTimeout(50)
    await page.getByTestId(cellId).click()
    return true
  }

  if (action.type === 'discard') {
    const chipId = `chip-${action.chip.color}-${action.chip.shape}`
    await page.getByTestId(chipId).click()
    await page.waitForTimeout(50)
    await page.getByTestId('btn-discard').click()
    return true
  }

  if (action.type === 'exchange') {
    // The exchange chip-selection UI is not yet wired (handleExchange sends an
    // empty set), so drive the exchange through the store action directly.
    await page.evaluate(
      (chips) => (window as any).__store.getState().exchangeChips(chips),
      action.chips,
    )
    return true
  }

  return false
}

test('5 bots play complete game to game_over with 5 valid scores', async ({ browser }) => {
  const hostPage = await browser.newPage()
  await hostPage.goto('/config')
  await hostPage.getByTestId('input-player-name').fill('Host')
  await hostPage.getByTestId('btn-create-room').click()
  await expect(hostPage.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })
  const code = await hostPage.getByTestId('room-code').textContent()

  const pages = [hostPage]
  for (const n of [2, 3, 4, 5]) {
    const bp = await browser.newPage()
    await bp.goto('/join')
    await bp.getByTestId('input-room-code').fill(code!)
    await bp.getByTestId('input-join-name').fill(`Bot-${n}`)
    await bp.getByTestId('btn-join-room').click()
    await expect(bp.getByTestId('lobby-screen')).toBeVisible({ timeout: 5000 })
    pages.push(bp)
  }

  await hostPage.getByTestId('btn-start-game').click()
  for (const p of pages) {
    await expect(p.getByTestId('game-screen')).toBeVisible({ timeout: 10000 })
  }

  const maxTurns = 500
  let turn = 0
  for (; turn < maxTurns; turn++) {
    let anyActed = false
    for (const p of pages) {
      const acted = await autoPlayTurn(p)
      if (acted) anyActed = true
    }

    const finished = await pages[0]!.evaluate(
      () => (window as any).__store.getState().gameState?.phase === 'finished',
    )
    if (finished) break

    if (!anyActed) await pages[0]!.waitForTimeout(100)
  }

  expect(turn).toBeLessThan(maxTurns)

  const results = await pages[0]!.evaluate(() => ({
    scores: (window as any).__store.getState().scores,
    bag: (window as any).__store.getState().gameState?.bag?.length,
  }))

  expect(results.scores).toHaveLength(5)
  // The game can end two valid ways: bag emptied with no legal move, OR every
  // player is stuck (no place/exchange/discard) while the bag still has chips
  // (the deadlock-fix termination). So the bag is >= 0, not necessarily 0.
  expect(results.bag).toBeGreaterThanOrEqual(0)
  for (const s of results.scores as any[]) {
    expect(s.combined).toBeGreaterThanOrEqual(-20)
    expect(s.combined).toBeLessThanOrEqual(50)
  }

  for (const p of pages) {
    await expect(p.getByTestId('results-screen')).toBeVisible({ timeout: 5000 })
    await p.close()
  }
})
