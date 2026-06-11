import http from 'http'
import type { AddressInfo } from 'net'
import Database from 'better-sqlite3'
import { Server } from 'socket.io'
import { io as ioClient } from 'socket.io-client'
import { wireHandlers } from '../../app'
import { applyMigrations } from '../../db/client'

export type TestClient = ReturnType<typeof ioClient>

export interface TestServer {
  db: Database.Database
  port: number
  connect(): TestClient
  close(): void
}

export async function createTestServer(): Promise<TestServer> {
  const db = new Database(':memory:')
  applyMigrations(db)

  const httpServer = http.createServer()
  const io = new Server(httpServer, { cors: { origin: '*' } })
  wireHandlers(io, db)

  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  const port = (httpServer.address() as AddressInfo).port

  return {
    db,
    port,
    connect() {
      return ioClient(`http://localhost:${port}`, {
        transports: ['websocket'],
        autoConnect: false,
      })
    },
    close() {
      io.close()
      httpServer.close()
      db.close()
    },
  }
}

export async function connectClient(server: TestServer): Promise<TestClient> {
  const client = server.connect()
  await new Promise<void>((resolve, reject) => {
    client.on('connect', resolve)
    client.on('connect_error', reject)
    client.connect()
  })
  return client
}
