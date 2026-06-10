import type { Server, Socket } from 'socket.io'
import type Database from 'better-sqlite3'
import express from 'express'
import cors from 'cors'
import type { ClientToServerEvents, ServerToClientEvents } from '@town77/shared-types'
import { logger } from './logger'
import { createRoomHandler } from './handlers/create-room'
import { joinRoomHandler } from './handlers/join-room'
import { startGameHandler } from './handlers/start-game'
import { placeChipHandler } from './handlers/place-chip'
import { exchangeChipsHandler } from './handlers/exchange-chips'
import { discardChipHandler } from './handlers/discard-chip'

declare module 'socket.io' {
  interface SocketData {
    playerId?: string
    roomCode?: string
  }
}

export type Io = Server<ClientToServerEvents, ServerToClientEvents>
export type Sock = Socket<ClientToServerEvents, ServerToClientEvents>
export type Db = Database.Database

export function wireHandlers(io: Io, db: Db): void {
  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'socket.connect')

    socket.on('create_room', createRoomHandler(io, socket, db))
    socket.on('join_room', joinRoomHandler(io, socket, db))
    socket.on('start_game', startGameHandler(io, socket, db))
    socket.on('place_chip', placeChipHandler(io, socket, db))
    socket.on('exchange_chips', exchangeChipsHandler(io, socket, db))
    socket.on('discard_chip', discardChipHandler(io, socket, db))

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'socket.disconnect')
    })
  })
}

export function createApp(): express.Express {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })
  return app
}
