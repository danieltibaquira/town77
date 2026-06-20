import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestServer, type TestServer } from './helpers/test-server'
import { createBotHost, createBotClient, type BotClient } from './helpers/bot-client'

describe('full game', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('10 bots play a complete game to game_over with valid scores', async () => {
    const { bot: host, code } = await createBotHost(server, 'Bot-1', { maxPlayers: 10 })

    const bots: BotClient[] = [host]
    for (let i = 2; i <= 10; i++) {
      bots.push(await createBotClient(server, code, `Bot-${i}`))
    }

    const scores: { playerId: string; placed: number; remaining: number; combined: number }[] =
      await new Promise((resolve) => {
        host.once('game_over', (payload) => resolve(payload.scores))
        host.emit('start_game')
      })

    expect(scores).toHaveLength(10)
    for (const s of scores) {
      expect(s.placed).toBeGreaterThanOrEqual(0)
      expect(s.remaining).toBeGreaterThanOrEqual(0)
      expect(s.combined).toBeGreaterThanOrEqual(-20)
      expect(s.combined).toBeLessThanOrEqual(50)
    }
    const min = Math.min(...scores.map((s) => s.combined))
    const max = Math.max(...scores.map((s) => s.combined))
    expect(max - min).toBeGreaterThan(0)

    for (const b of bots) b.disconnect()
  }, 120000)
})
