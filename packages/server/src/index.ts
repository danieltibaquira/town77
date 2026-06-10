import http from 'http'
import { Server } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@town77/shared-types'
import { createApp, wireHandlers } from './app'
import { openDatabase } from './db/client'
import { logger } from './logger'

const PORT = parseInt(process.env.PORT ?? '3077', 10)
const DB_PATH = process.env.DB_PATH ?? './town77.db'

const db = openDatabase(DB_PATH)
const app = createApp()
const httpServer = http.createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN ?? '*' },
})

wireHandlers(io, db)

httpServer.listen(PORT, () => {
  logger.info({ port: PORT, db: DB_PATH }, 'server.start')
})

process.on('SIGTERM', () => {
  logger.info({}, 'server.shutdown')
  httpServer.close(() => {
    db.close()
    process.exit(0)
  })
})
