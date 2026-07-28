import http from 'http'
import { Server } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@town77/shared-types'
import { createApp, wireHandlers } from './app'
import { openDatabase } from './db/client'
import { resetConnectedPlayers } from './db/rooms'
import { deleteExpiredRooms } from './db/room-cleanup'
import { logger } from './logger'

const PORT = parseInt(process.env.PORT ?? '3077', 10)
const DB_PATH = process.env.DB_PATH ?? './town77.db'

const db = openDatabase(DB_PATH)
resetConnectedPlayers(db)
const removedRooms = deleteExpiredRooms(db)
if (removedRooms > 0) logger.info({ removedRooms }, 'room.cleanup')
const cleanupTimer = setInterval(() => {
  const removed = deleteExpiredRooms(db)
  if (removed > 0) logger.info({ removedRooms: removed }, 'room.cleanup')
}, 60 * 60 * 1000)
cleanupTimer.unref()
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
