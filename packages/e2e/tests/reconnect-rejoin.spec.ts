import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'

// Regression for the connection-brittleness bug: socket.io room membership is
// in-memory and lost on every transport reconnect or server restart. The client
// must re-emit join_room on (re)connection so presence broadcasts keep reaching
// every client in the room without a manual reload.
//
// Note: restarts the local compose server container (town77-server-1).
test.describe('Reconnect rejoin (presence resilience)', () => {
  test('existing players see a new joiner after a server restart, without reload', async ({
    browser,
  }) => {
    const c1 = await browser.newContext()
    const creator = await c1.newPage()
    await creator.goto('/')
    await creator.getByTestId('btn-create').click()
    await expect(creator.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    const code = (await creator.getByTestId('room-code').textContent())!.trim()

    const c2 = await browser.newContext()
    const j1 = await c2.newPage()
    await j1.goto(`/room/${code}`)
    await expect(j1.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })
    await expect(creator.locator('[data-testid^="player-badge-"]')).toHaveCount(2, { timeout: 15000 })
    await expect(j1.locator('[data-testid^="player-badge-"]')).toHaveCount(2, { timeout: 15000 })

    // Drop every socket at once (mimics fly machine stop / redeploy / migration).
    execSync('docker restart town77-server-1', { stdio: 'ignore' })

    // Clients auto-reconnect; the fix auto-rejoins them to the room.
    await creator.waitForFunction(() => (window as unknown as { __store?: { getState: () => { connected: boolean } } }).__store?.getState().connected === true, null, { timeout: 40000 })
    await j1.waitForFunction(() => (window as unknown as { __store?: { getState: () => { connected: boolean } } }).__store?.getState().connected === true, null, { timeout: 40000 })

    // A new player joins via the room link after the restart.
    const c3 = await browser.newContext()
    const j2 = await c3.newPage()
    await j2.goto(`/room/${code}`)
    await expect(j2.getByTestId('lobby-screen')).toBeVisible({ timeout: 10000 })

    // The fix: existing players see the new joiner WITHOUT reloading.
    await expect(creator.locator('[data-testid^="player-badge-"]')).toHaveCount(3, { timeout: 15000 })
    await expect(j1.locator('[data-testid^="player-badge-"]')).toHaveCount(3, { timeout: 15000 })
    await expect(j2.locator('[data-testid^="player-badge-"]')).toHaveCount(3, { timeout: 15000 })

    await c1.close()
    await c2.close()
    await c3.close()
  })
})
