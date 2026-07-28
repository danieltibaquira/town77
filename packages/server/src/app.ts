import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Server, Socket } from 'socket.io'
import type Database from 'better-sqlite3'
import express from 'express'
import cors from 'cors'
import type { ClientToServerEvents, ServerToClientEvents } from '@town77/shared-types'
import { logger } from './logger'
import { createRoomHandler } from './handlers/create-room'
import { createSoloRoomHandler } from './handlers/create-solo-room'
import { joinRoomHandler } from './handlers/join-room'
import { startGameHandler } from './handlers/start-game'
import { startSoloGameHandler } from './handlers/solo-game'
import { placeChipHandler } from './handlers/place-chip'
import { exchangeChipsHandler } from './handlers/exchange-chips'
import { discardChipHandler } from './handlers/discard-chip'
import { cafeQueueActionHandler } from './handlers/cafe-queue-action'
import { disconnectHandler } from './handlers/disconnect'
import { PresenceRegistry } from './socket/presence'
import { RateLimiter } from './security/rate-limit'

declare module 'socket.io' {
  interface SocketData {
    playerId?: string
    roomCode?: string
  }
}

export type Io = Server<ClientToServerEvents, ServerToClientEvents>
export type Sock = Socket<ClientToServerEvents, ServerToClientEvents>
export type Db = Database.Database

const ROOM_ATTEMPT_EVENTS = new Set(['create_room', 'create_solo_room', 'join_room'])
const MUTATION_EVENTS = new Set(['start_game', 'start_solo_game', 'place_chip', 'exchange_chips', 'discard_chip', 'cafe_queue_action'])

export function wireHandlers(
  io: Io,
  db: Db,
  presence = new PresenceRegistry(),
  limiter = new RateLimiter(),
): void {
  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'socket.connect')

    socket.use(([event], next) => {
      const name = String(event)
      const key = ROOM_ATTEMPT_EVENTS.has(name)
        ? `ip:${socket.handshake.address}`
        : MUTATION_EVENTS.has(name)
          ? `socket:${socket.id}`
          : null
      const allowed = key === null || limiter.consume(key, ROOM_ATTEMPT_EVENTS.has(name) ? 10 : 60, ROOM_ATTEMPT_EVENTS.has(name) ? 60_000 : 10_000)
      if (!allowed) {
        socket.emit('error', { code: 'RATE_LIMITED', messageKey: 'errors.rate_limited' })
        return
      }
      next()
    })

    socket.on('create_room', createRoomHandler(io, socket, db, presence))
    socket.on('create_solo_room', createSoloRoomHandler(io, socket, db, presence))
    socket.on('join_room', joinRoomHandler(io, socket, db, presence))
    socket.on('start_game', startGameHandler(io, socket, db))
    socket.on('start_solo_game', startSoloGameHandler(io, socket, db))
    socket.on('place_chip', placeChipHandler(io, socket, db))
    socket.on('exchange_chips', exchangeChipsHandler(io, socket, db))
    socket.on('discard_chip', discardChipHandler(io, socket, db))
    socket.on('cafe_queue_action', cafeQueueActionHandler(io, socket, db))

    socket.on('disconnect', disconnectHandler(io, socket, db, presence))
  })
}

export function createApp(): express.Express {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  if (process.env.NODE_ENV === 'production') {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const clientDist = path.resolve(__dirname, '../../client/dist')
    app.use(express.static(clientDist))
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'))
    })
  }

  return app
}
