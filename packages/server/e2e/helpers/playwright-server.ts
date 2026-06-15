import http from 'http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AddressInfo } from 'net'
import { Server } from 'socket.io'
import Database from 'better-sqlite3'
import express from 'express'
import cors from 'cors'
import { applyMigrations } from '../../src/db/client'
import { wireHandlers } from '../../src/app'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(__dirname, '../../../../client/dist')

export interface PlaywrightServer {
  db: Database.Database
  url: string
  close(): void
}

export async function createPlaywrightServer(): Promise<PlaywrightServer> {
  const db = new Database(':memory:')
  applyMigrations(db)

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })

  const httpServer = http.createServer(app)
  const io = new Server(httpServer, { cors: { origin: '*' } })
  wireHandlers(io, db)

  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  const port = (httpServer.address() as AddressInfo).port

  return {
    db,
    url: `http://localhost:${port}`,
    close() {
      io.close()
      httpServer.close()
      db.close()
    },
  }
}
