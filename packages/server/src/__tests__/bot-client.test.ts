import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestServer, type TestServer } from './helpers/test-server'
import { createBotHost, createBotClient } from './helpers/bot-client'

describe('bot auto-play', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('three bots play a full game to game_over', async () => {
    // Fixed seed for a deterministic, reproducible game.
    const { bot: host, code } = await createBotHost(server, 'Bot-1', undefined, 42)
    const bot2 = await createBotClient(server, code, 'Bot-2')
    const bot3 = await createBotClient(server, code, 'Bot-3')

    const scores = await new Promise<unknown[]>((resolve) => {
      host.once('game_over', (payload) => resolve(payload.scores))
      host.emit('start_game')
    })

    expect(scores).toHaveLength(3)
    host.disconnect()
    bot2.disconnect()
    bot3.disconnect()
  }, 60000)
})
