import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import Database from 'better-sqlite3'
import express from 'express'
import cors from 'cors'
import { wireHandlers } from '../../src/app'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(__dirname, '../../../client/dist')

const db = new Database(':memory:')
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    code TEXT PRIMARY KEY, theme_id TEXT NOT NULL,
    config_json TEXT NOT NULL, state_json TEXT NOT NULL,
    seed INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY, room_code TEXT NOT NULL REFERENCES rooms(code),
    name TEXT NOT NULL, session_token TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_code);
`)

const app = express()
app.use(cors())
app.use(express.json())
app.get('/health', (_req, res) => { res.json({ ok: true }) })
app.use(express.static(clientDist))
app.get('*', (_req, res) => { res.sendFile(path.join(clientDist, 'index.html')) })

const httpServer = http.createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })
wireHandlers(io, db)

const port = parseInt(process.env.PORT ?? '3177', 10)
httpServer.listen(port, () => {
  process.stdout.write(`SERVER_READY:${port}\n`)
})

process.on('SIGTERM', () => { httpServer.close(); db.close(); process.exit(0) })
