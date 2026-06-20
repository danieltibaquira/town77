# Town 77 — Phase 2: Server (Express + Socket.IO + SQLite)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a containerised WebSocket game server that manages rooms, enforces all game rules via `@town77/game-engine`, persists state to SQLite, and recovers any session indefinitely.

**Architecture:** Express HTTP server (health endpoint only) + Socket.IO for all game traffic. All rule validation delegates to `@town77/game-engine` pure functions. State is written to SQLite on every mutation; the full `GameState` JSON blob is the single source of truth. `socket.data` tracks the authenticated player for each connection.

**Tech Stack:** Node.js 22, Express 4, Socket.IO 4, better-sqlite3 9, pino 9, tsup, Vitest 2, Docker (Alpine), docker-compose

---

## File Map

```
town77/
├── docker-compose.yml                    # production — server + sqlite volume
├── docker-compose.dev.yml                # dev — tsx watch, hot reload
└── packages/server/
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    ├── Dockerfile
    └── src/
        ├── index.ts                      # Entry: http.createServer, openDatabase, listen
        ├── app.ts                        # wireHandlers(), createApp(), SocketData types
        ├── logger.ts                     # pino singleton
        ├── db/
        │   ├── client.ts                 # openDatabase(), applyMigrations(), SQL schema
        │   ├── rooms.ts                  # createRoom, getRoom, updateRoomState
        │   └── players.ts               # createPlayer, getPlayerByToken, getPlayersByRoom
        ├── room/
        │   ├── code.ts                   # generateRoomCode() — 6-char unambiguous alphanumeric
        │   └── session.ts               # generateSessionToken(), generatePlayerId()
        ├── handlers/
        │   ├── create-room.ts
        │   ├── join-room.ts
        │   ├── start-game.ts
        │   ├── place-chip.ts
        │   ├── exchange-chips.ts
        │   └── discard-chip.ts
        └── __tests__/
            ├── helpers/
            │   └── test-server.ts        # createTestServer() — in-memory SQLite + real Socket.IO
            ├── db.test.ts
            ├── room-utils.test.ts
            ├── create-room.test.ts
            ├── join-room.test.ts
            ├── start-game.test.ts
            ├── place-chip.test.ts
            └── turn-actions.test.ts      # exchange + discard
```

---

## Task 1: Server package scaffold

**Files:**
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/server/vitest.config.ts`
- Create: `packages/server/src/logger.ts`

- [ ] **Step 1.1: Create packages/server/package.json**

```json
{
  "name": "@town77/server",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsup src/index.ts --format esm --no-splitting --external better-sqlite3",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@town77/game-engine": "workspace:*",
    "@town77/shared-types": "workspace:*",
    "better-sqlite3": "^9.6.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "pino": "^9.5.0",
    "socket.io": "^4.8.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "socket.io-client": "^4.8.0",
    "tsup": "^8.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "vite-tsconfig-paths": "^5.0.0"
  }
}
```

- [ ] **Step 1.2: Create packages/server/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "paths": {
      "@town77/shared-types": ["../shared-types/src/index.ts"],
      "@town77/game-engine": ["../game-engine/src/index.ts"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 1.3: Create packages/server/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
```

- [ ] **Step 1.4: Create packages/server/src/logger.ts**

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'town77-server',
    environment: process.env.NODE_ENV ?? 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label.toUpperCase() }) },
})
```

- [ ] **Step 1.5: Install deps from monorepo root**

```bash
pnpm install
```

Expected: `better-sqlite3`, `socket.io`, `pino`, `express` installed in `packages/server/node_modules`. No errors.

- [ ] **Step 1.6: Commit**

```bash
git add packages/server
git commit -m "feat(server): scaffold del paquete servidor"
```

---

## Task 2: DB layer (TDD)

**Files:**
- Create: `packages/server/src/db/client.ts`
- Create: `packages/server/src/db/rooms.ts`
- Create: `packages/server/src/db/players.ts`
- Create: `packages/server/src/__tests__/db.test.ts`

All commands run from `packages/server/`.

- [ ] **Step 2.1: Write the failing tests**

Create `packages/server/src/__tests__/db.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import type { GameState } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createGrid } from '@town77/game-engine'
import { applyMigrations } from '../db/client'
import { createRoom, getRoom, updateRoomState } from '../db/rooms'
import { createPlayer, getPlayerByToken, getPlayersByRoom } from '../db/players'

function makeState(): GameState {
  return {
    grid: createGrid(7, 7),
    bag: [],
    players: [],
    turnIndex: 0,
    phase: 'lobby',
    config: DEFAULT_GAME_CONFIG,
    themeId: 'town77',
    seed: 42,
  }
}

describe('DB migrations', () => {
  it('creates rooms and players tables without error', () => {
    const db = new Database(':memory:')
    expect(() => applyMigrations(db)).not.toThrow()
    db.close()
  })

  it('is idempotent — running twice does not throw', () => {
    const db = new Database(':memory:')
    applyMigrations(db)
    expect(() => applyMigrations(db)).not.toThrow()
    db.close()
  })
})

describe('rooms', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    applyMigrations(db)
  })

  afterEach(() => db.close())

  it('createRoom + getRoom round-trips correctly', () => {
    const state = makeState()
    createRoom(db, { code: 'ABC123', themeId: 'town77', config: DEFAULT_GAME_CONFIG, state, seed: 42 })
    const row = getRoom(db, 'ABC123')
    expect(row).toBeDefined()
    expect(row!.code).toBe('ABC123')
    expect(row!.theme_id).toBe('town77')
    expect(row!.seed).toBe(42)
    const parsed = JSON.parse(row!.state_json) as GameState
    expect(parsed.phase).toBe('lobby')
  })

  it('getRoom returns undefined for missing code', () => {
    expect(getRoom(db, 'XXXXXX')).toBeUndefined()
  })

  it('updateRoomState persists new state', () => {
    const state = makeState()
    createRoom(db, { code: 'ABC123', themeId: 'town77', config: DEFAULT_GAME_CONFIG, state, seed: 42 })
    const updated: GameState = { ...state, phase: 'playing' }
    updateRoomState(db, 'ABC123', updated)
    const row = getRoom(db, 'ABC123')
    const parsed = JSON.parse(row!.state_json) as GameState
    expect(parsed.phase).toBe('playing')
  })
})

describe('players', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    applyMigrations(db)
    createRoom(db, {
      code: 'ROOM01',
      themeId: 'town77',
      config: DEFAULT_GAME_CONFIG,
      state: makeState(),
      seed: 1,
    })
  })

  afterEach(() => db.close())

  it('createPlayer + getPlayerByToken round-trips', () => {
    createPlayer(db, { id: 'p1', roomCode: 'ROOM01', name: 'Alice', sessionToken: 'tok-alice' })
    const row = getPlayerByToken(db, 'tok-alice')
    expect(row).toBeDefined()
    expect(row!.id).toBe('p1')
    expect(row!.name).toBe('Alice')
    expect(row!.room_code).toBe('ROOM01')
  })

  it('getPlayerByToken returns undefined for unknown token', () => {
    expect(getPlayerByToken(db, 'unknown')).toBeUndefined()
  })

  it('getPlayersByRoom returns all players in insertion order', () => {
    createPlayer(db, { id: 'p1', roomCode: 'ROOM01', name: 'Alice', sessionToken: 'tok-a' })
    createPlayer(db, { id: 'p2', roomCode: 'ROOM01', name: 'Bob', sessionToken: 'tok-b' })
    const rows = getPlayersByRoom(db, 'ROOM01')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.name).toBe('Alice')
    expect(rows[1]!.name).toBe('Bob')
  })
})
```

- [ ] **Step 2.2: Run — expect FAIL**

```bash
pnpm test -- src/__tests__/db.test.ts
```

Expected: FAIL `Cannot find module '../db/client'`

- [ ] **Step 2.3: Create packages/server/src/db/client.ts**

```typescript
import Database from 'better-sqlite3'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS rooms (
  code        TEXT PRIMARY KEY,
  theme_id    TEXT NOT NULL,
  config_json TEXT NOT NULL,
  state_json  TEXT NOT NULL,
  seed        INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id            TEXT PRIMARY KEY,
  room_code     TEXT NOT NULL REFERENCES rooms(code),
  name          TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_code);
`

export function applyMigrations(db: Database.Database): void {
  db.exec(SCHEMA)
}

export function openDatabase(path: string): Database.Database {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  applyMigrations(db)
  return db
}
```

- [ ] **Step 2.4: Create packages/server/src/db/rooms.ts**

```typescript
import type Database from 'better-sqlite3'
import type { GameConfig, GameState } from '@town77/shared-types'

export interface RoomRow {
  code: string
  theme_id: string
  config_json: string
  state_json: string
  seed: number
  created_at: number
  updated_at: number
}

export function createRoom(
  db: Database.Database,
  params: { code: string; themeId: string; config: GameConfig; state: GameState; seed: number },
): void {
  const now = Date.now()
  db.prepare(
    `INSERT INTO rooms (code, theme_id, config_json, state_json, seed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(params.code, params.themeId, JSON.stringify(params.config), JSON.stringify(params.state), params.seed, now, now)
}

export function getRoom(db: Database.Database, code: string): RoomRow | undefined {
  return db.prepare('SELECT * FROM rooms WHERE code = ?').get(code) as RoomRow | undefined
}

export function updateRoomState(db: Database.Database, code: string, state: GameState): void {
  db.prepare('UPDATE rooms SET state_json = ?, updated_at = ? WHERE code = ?').run(
    JSON.stringify(state),
    Date.now(),
    code,
  )
}
```

- [ ] **Step 2.5: Create packages/server/src/db/players.ts**

```typescript
import type Database from 'better-sqlite3'

export interface PlayerRow {
  id: string
  room_code: string
  name: string
  session_token: string
  created_at: number
}

export function createPlayer(
  db: Database.Database,
  params: { id: string; roomCode: string; name: string; sessionToken: string },
): void {
  db.prepare(
    `INSERT INTO players (id, room_code, name, session_token, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(params.id, params.roomCode, params.name, params.sessionToken, Date.now())
}

export function getPlayerByToken(db: Database.Database, sessionToken: string): PlayerRow | undefined {
  return db.prepare('SELECT * FROM players WHERE session_token = ?').get(sessionToken) as PlayerRow | undefined
}

export function getPlayersByRoom(db: Database.Database, roomCode: string): PlayerRow[] {
  return db
    .prepare('SELECT * FROM players WHERE room_code = ? ORDER BY created_at ASC')
    .all(roomCode) as PlayerRow[]
}
```

- [ ] **Step 2.6: Run — expect PASS**

```bash
pnpm test -- src/__tests__/db.test.ts
```

Expected: all 9 DB tests green.

- [ ] **Step 2.7: Commit**

```bash
git add packages/server/src/db packages/server/src/__tests__/db.test.ts
git commit -m "feat(server): capa de datos SQLite — rooms y players"
```

---

## Task 3: Room utilities (TDD)

**Files:**
- Create: `packages/server/src/room/code.ts`
- Create: `packages/server/src/room/session.ts`
- Create: `packages/server/src/__tests__/room-utils.test.ts`

- [ ] **Step 3.1: Write the failing tests**

Create `packages/server/src/__tests__/room-utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateRoomCode } from '../room/code'
import { generateSessionToken, generatePlayerId } from '../room/session'

describe('generateRoomCode', () => {
  it('returns a 6-character string', () => {
    expect(generateRoomCode()).toHaveLength(6)
  })

  it('uses only unambiguous characters (no I, O, 0, 1)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode()
      expect(code).not.toMatch(/[IO01]/)
    }
  })

  it('returns only uppercase alphanumeric', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateRoomCode()).toMatch(/^[A-Z2-9]{6}$/)
    }
  })

  it('generates unique codes (200 samples, no collision)', () => {
    const codes = new Set(Array.from({ length: 200 }, generateRoomCode))
    expect(codes.size).toBe(200)
  })
})

describe('generateSessionToken', () => {
  it('returns 64-character hex string', () => {
    const token = generateSessionToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 50 }, generateSessionToken))
    expect(tokens.size).toBe(50)
  })
})

describe('generatePlayerId', () => {
  it('returns 32-character hex string', () => {
    const id = generatePlayerId()
    expect(id).toHaveLength(32)
    expect(id).toMatch(/^[0-9a-f]{32}$/)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, generatePlayerId))
    expect(ids.size).toBe(50)
  })
})
```

- [ ] **Step 3.2: Run — expect FAIL**

```bash
pnpm test -- src/__tests__/room-utils.test.ts
```

Expected: FAIL `Cannot find module '../room/code'`

- [ ] **Step 3.3: Create packages/server/src/room/code.ts**

```typescript
import { randomBytes } from 'crypto'

// Omit I, O, 0, 1 to avoid visual confusion
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  const bytes = randomBytes(6)
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]!).join('')
}
```

- [ ] **Step 3.4: Create packages/server/src/room/session.ts**

```typescript
import { randomBytes } from 'crypto'

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function generatePlayerId(): string {
  return randomBytes(16).toString('hex')
}
```

- [ ] **Step 3.5: Run — expect PASS**

```bash
pnpm test -- src/__tests__/room-utils.test.ts
```

Expected: all 8 utility tests green.

- [ ] **Step 3.6: Commit**

```bash
git add packages/server/src/room packages/server/src/__tests__/room-utils.test.ts
git commit -m "feat(server): utilidades de sala — código de sala y token de sesión"
```

---

## Task 4: Test server helper + `create_room` handler (TDD)

**Files:**
- Create: `packages/server/src/__tests__/helpers/test-server.ts`
- Create: `packages/server/src/app.ts`
- Create: `packages/server/src/handlers/create-room.ts`
- Create: `packages/server/src/__tests__/create-room.test.ts`

- [ ] **Step 4.1: Create test server helper**

Create `packages/server/src/__tests__/helpers/test-server.ts`:

```typescript
import http from 'http'
import type { AddressInfo } from 'net'
import { Server } from 'socket.io'
import { io as ioClient } from 'socket.io-client'
import Database from 'better-sqlite3'
import { applyMigrations } from '../../db/client'
import { wireHandlers } from '../../app'

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
```

- [ ] **Step 4.2: Write the failing test**

Create `packages/server/src/__tests__/create-room.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { RoomJoinedPayload } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createTestServer, connectClient, type TestServer, type TestClient } from './helpers/test-server'

describe('create_room', () => {
  let server: TestServer
  let client: TestClient

  beforeEach(async () => {
    server = await createTestServer()
    client = await connectClient(server)
  })

  afterEach(() => {
    client.disconnect()
    server.close()
  })

  it('emits room_joined with valid 6-char room code', async () => {
    const payload = await new Promise<RoomJoinedPayload>((resolve) => {
      client.on('room_joined', resolve)
      client.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Alice',
      })
    })
    expect(payload.code).toMatch(/^[A-Z2-9]{6}$/)
    expect(payload.playerId).toHaveLength(32)
    expect(payload.sessionToken).toHaveLength(64)
    expect(payload.state.phase).toBe('lobby')
    expect(payload.state.players).toHaveLength(1)
    expect(payload.state.players[0]!.name).toBe('Alice')
    expect(payload.state.players[0]!.connected).toBe(true)
    expect(payload.state.players[0]!.hand).toHaveLength(0)
  })

  it('persists room and player to SQLite', async () => {
    await new Promise<RoomJoinedPayload>((resolve) => {
      client.on('room_joined', resolve)
      client.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Alice',
      })
    })
    const roomCount = (server.db.prepare('SELECT COUNT(*) as n FROM rooms').get() as { n: number }).n
    const playerCount = (server.db.prepare('SELECT COUNT(*) as n FROM players').get() as { n: number }).n
    expect(roomCount).toBe(1)
    expect(playerCount).toBe(1)
  })

  it('initialises bag with correct chip count in state', async () => {
    const payload = await new Promise<RoomJoinedPayload>((resolve) => {
      client.on('room_joined', resolve)
      client.emit('create_room', {
        config: DEFAULT_GAME_CONFIG,
        themeId: 'town77',
        playerName: 'Alice',
      })
    })
    // Default config: 7 × 7 × 1 = 49 chips in bag before hands are dealt
    expect(payload.state.bag).toHaveLength(49)
  })
})
```

- [ ] **Step 4.3: Run — expect FAIL**

```bash
pnpm test -- src/__tests__/create-room.test.ts
```

Expected: FAIL `Cannot find module '../../app'`

- [ ] **Step 4.4: Create packages/server/src/app.ts** (stub — handlers wired here)

```typescript
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

// Augment socket.data with player session
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
  app.get('/health', (_req, res) => { res.json({ ok: true }) })
  return app
}
```

- [ ] **Step 4.5: Create stub handlers so app.ts compiles**

Create `packages/server/src/handlers/join-room.ts` (stub):

```typescript
import type { JoinRoomPayload } from '@town77/shared-types'
import type { Io, Sock, Db } from '../app'
export function joinRoomHandler(_io: Io, _socket: Sock, _db: Db) {
  return (_payload: JoinRoomPayload) => {}
}
```

Create `packages/server/src/handlers/start-game.ts` (stub):

```typescript
import type { Io, Sock, Db } from '../app'
export function startGameHandler(_io: Io, _socket: Sock, _db: Db) {
  return () => {}
}
```

Create `packages/server/src/handlers/place-chip.ts` (stub):

```typescript
import type { PlaceChipPayload } from '@town77/shared-types'
import type { Io, Sock, Db } from '../app'
export function placeChipHandler(_io: Io, _socket: Sock, _db: Db) {
  return (_payload: PlaceChipPayload) => {}
}
```

Create `packages/server/src/handlers/exchange-chips.ts` (stub):

```typescript
import type { ExchangeChipsPayload } from '@town77/shared-types'
import type { Io, Sock, Db } from '../app'
export function exchangeChipsHandler(_io: Io, _socket: Sock, _db: Db) {
  return (_payload: ExchangeChipsPayload) => {}
}
```

Create `packages/server/src/handlers/discard-chip.ts` (stub):

```typescript
import type { DiscardChipPayload } from '@town77/shared-types'
import type { Io, Sock, Db } from '../app'
export function discardChipHandler(_io: Io, _socket: Sock, _db: Db) {
  return (_payload: DiscardChipPayload) => {}
}
```

- [ ] **Step 4.6: Create packages/server/src/handlers/create-room.ts**

```typescript
import { randomInt } from 'crypto'
import type { CreateRoomPayload } from '@town77/shared-types'
import type { GameState } from '@town77/shared-types'
import { initBag, createGrid, SeededRNG } from '@town77/game-engine'
import { createRoom } from '../db/rooms'
import { createPlayer } from '../db/players'
import { generateRoomCode } from '../room/code'
import { generateSessionToken, generatePlayerId } from '../room/session'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function createRoomHandler(io: Io, socket: Sock, db: Db) {
  return (payload: CreateRoomPayload) => {
    const { config, themeId, playerName } = payload

    const code = generateRoomCode()
    const seed = randomInt(0, 2 ** 31)
    const playerId = generatePlayerId()
    const sessionToken = generateSessionToken()

    const rng = new SeededRNG(seed)
    const bag = initBag(config.chips, rng)

    const state: GameState = {
      grid: createGrid(config.grid.rows, config.grid.cols),
      bag,
      players: [
        {
          id: playerId,
          name: playerName,
          hand: [],
          placed: 0,
          hasDiscarded: false,
          connected: true,
        },
      ],
      turnIndex: 0,
      phase: 'lobby',
      config,
      themeId,
      seed,
    }

    createRoom(db, { code, themeId, config, state, seed })
    createPlayer(db, { id: playerId, roomCode: code, name: playerName, sessionToken })

    socket.data = { playerId, roomCode: code }
    void socket.join(code)

    logger.info({ roomCode: code, playerId, playerName }, 'room.created')
    socket.emit('room_joined', { code, playerId, sessionToken, state })
  }
}
```

- [ ] **Step 4.7: Run — expect PASS**

```bash
pnpm test -- src/__tests__/create-room.test.ts
```

Expected: all 3 create_room tests green.

- [ ] **Step 4.8: Commit**

```bash
git add packages/server/src
git commit -m "feat(server): handler create_room — crea sala y emite room_joined"
```

---

## Task 5: `join_room` handler (TDD)

**Files:**
- Modify: `packages/server/src/handlers/join-room.ts` (replace stub)
- Create: `packages/server/src/__tests__/join-room.test.ts`

- [ ] **Step 5.1: Write the failing tests**

Create `packages/server/src/__tests__/join-room.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { RoomJoinedPayload, StateUpdatePayload } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createTestServer, connectClient, type TestServer, type TestClient } from './helpers/test-server'

async function createRoomAs(client: TestClient, name: string): Promise<RoomJoinedPayload> {
  return new Promise((resolve) => {
    client.on('room_joined', resolve)
    client.emit('create_room', { config: DEFAULT_GAME_CONFIG, themeId: 'town77', playerName: name })
  })
}

describe('join_room', () => {
  let server: TestServer
  let host: TestClient
  let guest: TestClient

  beforeEach(async () => {
    server = await createTestServer()
    host = await connectClient(server)
    guest = await connectClient(server)
  })

  afterEach(() => {
    host.disconnect()
    guest.disconnect()
    server.close()
  })

  it('guest joins an existing lobby room', async () => {
    const { code } = await createRoomAs(host, 'Alice')

    const guestPayload = await new Promise<RoomJoinedPayload>((resolve) => {
      guest.on('room_joined', resolve)
      guest.emit('join_room', { code, playerName: 'Bob' })
    })

    expect(guestPayload.code).toBe(code)
    expect(guestPayload.state.players).toHaveLength(2)
    expect(guestPayload.state.players[1]!.name).toBe('Bob')
  })

  it('host receives state_update when guest joins', async () => {
    const { code } = await createRoomAs(host, 'Alice')

    const stateUpdate = new Promise<StateUpdatePayload>((resolve) => {
      host.on('state_update', resolve)
    })

    guest.emit('join_room', { code, playerName: 'Bob' })
    const update = await stateUpdate
    expect(update.state.players).toHaveLength(2)
  })

  it('emits error for unknown room code', async () => {
    const err = await new Promise<{ code: string }>((resolve) => {
      guest.on('error', resolve)
      guest.emit('join_room', { code: 'XXXXXX', playerName: 'Bob' })
    })
    expect(err.code).toBe('ROOM_NOT_FOUND')
  })

  it('session recovery: reconnecting with sessionToken restores player', async () => {
    const { code, sessionToken, playerId } = await createRoomAs(host, 'Alice')

    // Disconnect and reconnect with a fresh socket carrying the same token
    const returner = await connectClient(server)
    const recovered = await new Promise<RoomJoinedPayload>((resolve) => {
      returner.on('room_joined', resolve)
      returner.emit('join_room', { code, playerName: 'Alice', sessionToken })
    })

    expect(recovered.playerId).toBe(playerId)
    expect(recovered.sessionToken).toBe(sessionToken)
    returner.disconnect()
  })
})
```

- [ ] **Step 5.2: Run — expect FAIL**

```bash
pnpm test -- src/__tests__/join-room.test.ts
```

Expected: FAIL (stub join_room handler is empty, no event emitted).

- [ ] **Step 5.3: Implement packages/server/src/handlers/join-room.ts**

```typescript
import type { JoinRoomPayload } from '@town77/shared-types'
import type { GameState } from '@town77/shared-types'
import { createPlayer } from '../db/players'
import { getRoom, updateRoomState } from '../db/rooms'
import { getPlayerByToken } from '../db/players'
import { generateSessionToken, generatePlayerId } from '../room/session'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

const MAX_PLAYERS = 5

export function joinRoomHandler(io: Io, socket: Sock, db: Db) {
  return (payload: JoinRoomPayload) => {
    const { code, playerName, sessionToken } = payload

    const roomRow = getRoom(db, code)
    if (!roomRow) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', messageKey: 'errors.room_not_found' })
      return
    }

    const state: GameState = JSON.parse(roomRow.state_json) as GameState

    // --- Session recovery ---
    if (sessionToken) {
      const playerRow = getPlayerByToken(db, sessionToken)
      if (playerRow && playerRow.room_code === code) {
        const updatedPlayers = state.players.map((p) =>
          p.id === playerRow.id ? { ...p, connected: true } : p,
        )
        const updatedState: GameState = { ...state, players: updatedPlayers }
        updateRoomState(db, code, updatedState)

        socket.data = { playerId: playerRow.id, roomCode: code }
        void socket.join(code)

        logger.info({ roomCode: code, playerId: playerRow.id }, 'player.reconnected')
        socket.emit('room_joined', {
          code,
          playerId: playerRow.id,
          sessionToken,
          state: updatedState,
        })
        socket.to(code).emit('state_update', { state: updatedState })
        return
      }
    }

    // --- New player ---
    if (state.phase !== 'lobby') {
      socket.emit('error', { code: 'GAME_IN_PROGRESS', messageKey: 'errors.game_in_progress' })
      return
    }
    if (state.players.length >= MAX_PLAYERS) {
      socket.emit('error', { code: 'ROOM_FULL', messageKey: 'errors.room_full' })
      return
    }

    const playerId = generatePlayerId()
    const newToken = generateSessionToken()

    const updatedState: GameState = {
      ...state,
      players: [
        ...state.players,
        { id: playerId, name: playerName, hand: [], placed: 0, hasDiscarded: false, connected: true },
      ],
    }

    updateRoomState(db, code, updatedState)
    createPlayer(db, { id: playerId, roomCode: code, name: playerName, sessionToken: newToken })

    socket.data = { playerId, roomCode: code }
    void socket.join(code)

    logger.info({ roomCode: code, playerId, playerName }, 'player.joined')
    socket.emit('room_joined', { code, playerId, sessionToken: newToken, state: updatedState })
    socket.to(code).emit('state_update', { state: updatedState })
  }
}
```

- [ ] **Step 5.4: Run — expect PASS**

```bash
pnpm test -- src/__tests__/join-room.test.ts
```

Expected: all 4 join_room tests green.

- [ ] **Step 5.5: Run full suite**

```bash
pnpm test
```

Expected: all prior tests still pass (db + room-utils + create_room + join_room).

- [ ] **Step 5.6: Commit**

```bash
git add packages/server/src/handlers/join-room.ts packages/server/src/__tests__/join-room.test.ts
git commit -m "feat(server): handler join_room — unirse a sala y recuperación de sesión"
```

---

## Task 6: `start_game` handler (TDD)

**Files:**
- Modify: `packages/server/src/handlers/start-game.ts` (replace stub)
- Create: `packages/server/src/__tests__/start-game.test.ts`

- [ ] **Step 6.1: Write the failing tests**

Create `packages/server/src/__tests__/start-game.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { RoomJoinedPayload, StateUpdatePayload } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createTestServer, connectClient, type TestServer, type TestClient } from './helpers/test-server'

async function setupLobby(server: TestServer) {
  const host = await connectClient(server)
  const guest = await connectClient(server)

  const { code } = await new Promise<RoomJoinedPayload>((resolve) => {
    host.on('room_joined', resolve)
    host.emit('create_room', { config: DEFAULT_GAME_CONFIG, themeId: 'town77', playerName: 'Alice' })
  })

  await new Promise<RoomJoinedPayload>((resolve) => {
    guest.on('room_joined', resolve)
    guest.emit('join_room', { code, playerName: 'Bob' })
  })

  return { host, guest, code }
}

describe('start_game', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('transitions state to playing and deals hands', async () => {
    const { host, guest, code } = await setupLobby(server)

    const hostUpdate = new Promise<StateUpdatePayload>((resolve) => host.on('state_update', resolve))
    const guestUpdate = new Promise<StateUpdatePayload>((resolve) => guest.on('state_update', resolve))

    host.emit('start_game')

    const [h, g] = await Promise.all([hostUpdate, guestUpdate])
    expect(h.state.phase).toBe('playing')
    // Each player dealt handSize (4) chips
    expect(h.state.players[0]!.hand).toHaveLength(4)
    expect(h.state.players[1]!.hand).toHaveLength(4)
    // Bag reduced by 2 × 4 = 8
    expect(h.state.bag).toHaveLength(49 - 8)
    // Same state seen by both clients
    expect(h.state).toEqual(g.state)
    host.disconnect()
    guest.disconnect()
    code // used to avoid unused var warning
  })

  it('emits error if caller is not the host', async () => {
    const { host, guest } = await setupLobby(server)

    const err = await new Promise<{ code: string }>((resolve) => {
      guest.on('error', resolve)
      guest.emit('start_game')
    })
    expect(err.code).toBe('NOT_HOST')
    host.disconnect()
    guest.disconnect()
  })

  it('emits error if fewer than 2 players', async () => {
    const solo = await connectClient(server)
    await new Promise<RoomJoinedPayload>((resolve) => {
      solo.on('room_joined', resolve)
      solo.emit('create_room', { config: DEFAULT_GAME_CONFIG, themeId: 'town77', playerName: 'Solo' })
    })

    const err = await new Promise<{ code: string }>((resolve) => {
      solo.on('error', resolve)
      solo.emit('start_game')
    })
    expect(err.code).toBe('NOT_ENOUGH_PLAYERS')
    solo.disconnect()
  })
})
```

- [ ] **Step 6.2: Run — expect FAIL**

```bash
pnpm test -- src/__tests__/start-game.test.ts
```

Expected: FAIL (stub emits nothing).

- [ ] **Step 6.3: Implement packages/server/src/handlers/start-game.ts**

```typescript
import { randomInt } from 'crypto'
import type { GameState } from '@town77/shared-types'
import { dealHands } from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function startGameHandler(io: Io, socket: Sock, db: Db) {
  return () => {
    const { playerId, roomCode } = socket.data
    if (!playerId || !roomCode) {
      socket.emit('error', { code: 'NOT_IN_ROOM', messageKey: 'errors.not_in_room' })
      return
    }

    const roomRow = getRoom(db, roomCode)
    if (!roomRow) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', messageKey: 'errors.room_not_found' })
      return
    }

    const state: GameState = JSON.parse(roomRow.state_json) as GameState

    if (state.players[0]?.id !== playerId) {
      socket.emit('error', { code: 'NOT_HOST', messageKey: 'errors.not_host' })
      return
    }
    if (state.players.length < 2) {
      socket.emit('error', { code: 'NOT_ENOUGH_PLAYERS', messageKey: 'errors.not_enough_players' })
      return
    }
    if (state.phase !== 'lobby') {
      socket.emit('error', { code: 'ALREADY_STARTED', messageKey: 'errors.already_started' })
      return
    }

    const { hands, remainingBag } = dealHands(state.bag, state.players.length, state.config.handSize)
    const firstPlayerIndex = randomInt(0, state.players.length)

    const updatedState: GameState = {
      ...state,
      bag: remainingBag,
      players: state.players.map((p, i) => ({ ...p, hand: hands[i] ?? [] })),
      turnIndex: firstPlayerIndex,
      phase: 'playing',
    }

    updateRoomState(db, roomCode, updatedState)
    logger.info({ roomCode, firstPlayerIndex }, 'game.started')
    io.to(roomCode).emit('state_update', { state: updatedState })
  }
}
```

- [ ] **Step 6.4: Run — expect PASS**

```bash
pnpm test -- src/__tests__/start-game.test.ts
```

Expected: all 3 start_game tests green.

- [ ] **Step 6.5: Commit**

```bash
git add packages/server/src/handlers/start-game.ts packages/server/src/__tests__/start-game.test.ts
git commit -m "feat(server): handler start_game — inicia la partida y reparte fichas"
```

---

## Task 7: `place_chip` handler (TDD)

**Files:**
- Modify: `packages/server/src/handlers/place-chip.ts` (replace stub)
- Create: `packages/server/src/__tests__/place-chip.test.ts`

- [ ] **Step 7.1: Write the failing tests**

Create `packages/server/src/__tests__/place-chip.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { RoomJoinedPayload, StateUpdatePayload, GameOverPayload } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createTestServer, connectClient, type TestServer, type TestClient } from './helpers/test-server'

async function startGame(server: TestServer) {
  const host = await connectClient(server)
  const guest = await connectClient(server)

  const { code } = await new Promise<RoomJoinedPayload>((resolve) => {
    host.on('room_joined', resolve)
    host.emit('create_room', { config: DEFAULT_GAME_CONFIG, themeId: 'town77', playerName: 'Alice' })
  })
  await new Promise<RoomJoinedPayload>((resolve) => {
    guest.on('room_joined', resolve)
    guest.emit('join_room', { code, playerName: 'Bob' })
  })

  const started = new Promise<StateUpdatePayload>((resolve) => host.on('state_update', resolve))
  host.emit('start_game')
  const state = (await started).state
  return { host, guest, code, state }
}

describe('place_chip', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('valid first placement updates state for all players', async () => {
    const { host, guest, state } = await startGame(server)

    // Identify who goes first
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest
    const chipToPlace = state.players[turnIdx]!.hand[0]!

    const hostUpdate = new Promise<StateUpdatePayload>((resolve) => host.on('state_update', resolve))
    const guestUpdate = new Promise<StateUpdatePayload>((resolve) => guest.on('state_update', resolve))

    activeClient.emit('place_chip', { chip: chipToPlace, row: 3, col: 3 })

    const [h] = await Promise.all([hostUpdate, guestUpdate])
    expect(h.state.grid[3]![3]).toEqual(chipToPlace)
    expect(h.state.players[turnIdx]!.placed).toBe(1)

    host.disconnect()
    guest.disconnect()
  })

  it('emits error when it is not the caller\'s turn', async () => {
    const { host, guest, state } = await startGame(server)

    const wrongClient = state.turnIndex === 0 ? guest : host
    const wrongIdx = state.turnIndex === 0 ? 1 : 0
    const chip = state.players[wrongIdx]!.hand[0]!

    const err = await new Promise<{ code: string }>((resolve) => {
      wrongClient.on('error', resolve)
      wrongClient.emit('place_chip', { chip, row: 3, col: 3 })
    })
    expect(err.code).toBe('NOT_YOUR_TURN')
    host.disconnect()
    guest.disconnect()
  })

  it('emits error for invalid placement (chip not in hand)', async () => {
    const { host, guest, state } = await startGame(server)

    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest
    const fakeChip = { color: 'color-99', shape: 'ghost' }

    const err = await new Promise<{ code: string }>((resolve) => {
      activeClient.on('error', resolve)
      activeClient.emit('place_chip', { chip: fakeChip, row: 3, col: 3 })
    })
    expect(err.code).toBe('INVALID_PLACEMENT')
    host.disconnect()
    guest.disconnect()
  })
})
```

- [ ] **Step 7.2: Run — expect FAIL**

```bash
pnpm test -- src/__tests__/place-chip.test.ts
```

Expected: FAIL (stub emits nothing).

- [ ] **Step 7.3: Implement packages/server/src/handlers/place-chip.ts**

```typescript
import type { PlaceChipPayload, GameState } from '@town77/shared-types'
import {
  isValidPlacement,
  applyPlacement,
  isFirstChipOnGrid,
  drawChips,
  calculateScores,
  isGameOver,
} from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function placeChipHandler(io: Io, socket: Sock, db: Db) {
  return (payload: PlaceChipPayload) => {
    const { playerId, roomCode } = socket.data
    if (!playerId || !roomCode) {
      socket.emit('error', { code: 'NOT_IN_ROOM', messageKey: 'errors.not_in_room' })
      return
    }

    const roomRow = getRoom(db, roomCode)
    if (!roomRow) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', messageKey: 'errors.room_not_found' })
      return
    }

    const state: GameState = JSON.parse(roomRow.state_json) as GameState

    if (state.phase !== 'playing') {
      socket.emit('error', { code: 'GAME_NOT_ACTIVE', messageKey: 'errors.game_not_active' })
      return
    }

    const currentPlayer = state.players[state.turnIndex]
    if (!currentPlayer || currentPlayer.id !== playerId) {
      socket.emit('error', { code: 'NOT_YOUR_TURN', messageKey: 'errors.not_your_turn' })
      return
    }

    const { chip, row, col } = payload

    // Verify chip is in hand
    const chipInHand = currentPlayer.hand.some(
      (h) => h.color === chip.color && h.shape === chip.shape,
    )
    if (!chipInHand) {
      socket.emit('error', { code: 'INVALID_PLACEMENT', messageKey: 'errors.invalid_placement' })
      return
    }

    const isFirst = isFirstChipOnGrid(state.grid)
    if (!isValidPlacement(state.grid, row, col, chip, isFirst)) {
      socket.emit('error', { code: 'INVALID_PLACEMENT', messageKey: 'errors.invalid_placement' })
      return
    }

    // Apply placement — remove chip from hand
    const newGrid = applyPlacement(state.grid, row, col, chip)
    const handAfterPlace = currentPlayer.hand.filter(
      (h, i, arr) => {
        if (h.color === chip.color && h.shape === chip.shape) {
          arr.splice(i, 1) // mutates copy — but we'll rebuild below
        }
        return true
      },
    )
    // Correct approach: remove first occurrence only
    const chipIdx = currentPlayer.hand.findIndex(
      (h) => h.color === chip.color && h.shape === chip.shape,
    )
    const handWithout = [
      ...currentPlayer.hand.slice(0, chipIdx),
      ...currentPlayer.hand.slice(chipIdx + 1),
    ]

    // Draw replacement
    const { drawn, remainingBag } = drawChips(state.bag, 1)
    const newHand = [...handWithout, ...drawn]

    const updatedPlayers = state.players.map((p, i) =>
      i === state.turnIndex
        ? { ...p, hand: newHand, placed: p.placed + 1 }
        : p,
    )

    const nextTurnIndex = (state.turnIndex + 1) % state.players.length

    const updatedState: GameState = {
      ...state,
      grid: newGrid,
      bag: remainingBag,
      players: updatedPlayers,
      turnIndex: nextTurnIndex,
    }

    if (isGameOver(updatedState.grid, updatedState.bag, updatedState.players)) {
      const finalState: GameState = { ...updatedState, phase: 'finished' }
      updateRoomState(db, roomCode, finalState)
      const scores = calculateScores(finalState.players, finalState.config.scoring)
      logger.info({ roomCode, scores }, 'game.over')
      io.to(roomCode).emit('game_over', { scores })
      return
    }

    updateRoomState(db, roomCode, updatedState)
    logger.info({ roomCode, playerId, row, col }, 'chip.placed')
    io.to(roomCode).emit('state_update', { state: updatedState })
  }
}
```

- [ ] **Step 7.4: Run — expect PASS**

```bash
pnpm test -- src/__tests__/place-chip.test.ts
```

Expected: all 3 place_chip tests green.

- [ ] **Step 7.5: Commit**

```bash
git add packages/server/src/handlers/place-chip.ts packages/server/src/__tests__/place-chip.test.ts
git commit -m "feat(server): handler place_chip — colocación validada y actualización de estado"
```

---

## Task 8: `exchange_chips` + `discard_chip` handlers (TDD)

**Files:**
- Modify: `packages/server/src/handlers/exchange-chips.ts` (replace stub)
- Modify: `packages/server/src/handlers/discard-chip.ts` (replace stub)
- Create: `packages/server/src/__tests__/turn-actions.test.ts`

- [ ] **Step 8.1: Write the failing tests**

Create `packages/server/src/__tests__/turn-actions.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { RoomJoinedPayload, StateUpdatePayload } from '@town77/shared-types'
import type { Chip } from '@town77/shared-types'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { createTestServer, connectClient, type TestServer, type TestClient } from './helpers/test-server'

async function startGame(server: TestServer) {
  const host = await connectClient(server)
  const guest = await connectClient(server)

  const { code } = await new Promise<RoomJoinedPayload>((resolve) => {
    host.on('room_joined', resolve)
    host.emit('create_room', { config: DEFAULT_GAME_CONFIG, themeId: 'town77', playerName: 'Alice' })
  })
  await new Promise<RoomJoinedPayload>((resolve) => {
    guest.on('room_joined', resolve)
    guest.emit('join_room', { code, playerName: 'Bob' })
  })

  const started = new Promise<StateUpdatePayload>((resolve) => host.on('state_update', resolve))
  host.emit('start_game')
  const state = (await started).state
  return { host, guest, code, state }
}

// Build a hand that has 3+ chips sharing a color (may need to manipulate DB directly)
async function forceExchangeableHand(
  server: TestServer,
  playerIdx: number,
  state: typeof (await startGame(server)).state,
): Promise<{ color: string; hand: Chip[] }> {
  // Take the first 3 chips of the active player's hand
  // If they don't share color, patch the DB state directly to force it
  const player = state.players[playerIdx]!
  const firstColor = player.hand[0]!.color
  const sameColor = player.hand.filter((c) => c.color === firstColor)

  if (sameColor.length >= 3) {
    return { color: firstColor, hand: sameColor.slice(0, 3) }
  }

  // Patch DB: override hand with 3 same-color chips + 1 other
  const row = server.db.prepare('SELECT * FROM rooms').get() as { code: string; state_json: string }
  const s = JSON.parse(row.state_json) as typeof state
  const color = s.players[playerIdx]!.hand[0]!.color
  const shapes = DEFAULT_GAME_CONFIG.chips.shapes
  const forcedHand: Chip[] = [
    { color, shape: shapes[0]! },
    { color, shape: shapes[1]! },
    { color, shape: shapes[2]! },
    { color: s.players[playerIdx]!.hand[3]?.color ?? 'color-7', shape: shapes[3]! },
  ]
  s.players[playerIdx]!.hand = forcedHand
  server.db.prepare('UPDATE rooms SET state_json = ? WHERE code = ?').run(
    JSON.stringify(s),
    row.code,
  )
  return { color, hand: forcedHand.slice(0, 3) }
}

describe('exchange_chips', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('exchanges chips and advances turn', async () => {
    const { host, guest, state } = await startGame(server)
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest

    const { hand: toExchange } = await forceExchangeableHand(server, turnIdx, state)

    const stateUpdate = new Promise<StateUpdatePayload>((resolve) => {
      host.on('state_update', resolve)
    })

    activeClient.emit('exchange_chips', { chips: toExchange })
    const updated = await stateUpdate

    // Turn advanced
    expect(updated.state.turnIndex).toBe((turnIdx + 1) % 2)
    // Hand size preserved
    expect(updated.state.players[turnIdx]!.hand).toHaveLength(4)

    host.disconnect()
    guest.disconnect()
  })

  it('emits error when chips do not share color or shape', async () => {
    const { host, guest, state } = await startGame(server)
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest
    const hand = state.players[turnIdx]!.hand

    // Pick chips that likely differ in both color and shape
    const mixedChips = [hand[0]!, hand[1]!, hand[2]!].map((c, i) => ({
      ...c,
      color: `color-${i + 1}`,
      shape: `shape-${i + 1}`,
    }))

    const err = await new Promise<{ code: string }>((resolve) => {
      activeClient.on('error', resolve)
      activeClient.emit('exchange_chips', { chips: mixedChips })
    })
    expect(err.code).toBe('INVALID_EXCHANGE')
    host.disconnect()
    guest.disconnect()
  })
})

describe('discard_chip', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await createTestServer()
  })

  afterEach(() => server.close())

  it('discards chip and advances turn', async () => {
    const { host, guest, state } = await startGame(server)
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest
    const chip = state.players[turnIdx]!.hand[0]!

    const stateUpdate = new Promise<StateUpdatePayload>((resolve) => host.on('state_update', resolve))
    activeClient.emit('discard_chip', { chip })
    const updated = await stateUpdate

    expect(updated.state.turnIndex).toBe((turnIdx + 1) % 2)
    expect(updated.state.players[turnIdx]!.hasDiscarded).toBe(true)
    host.disconnect()
    guest.disconnect()
  })

  it('emits error if player already discarded this game', async () => {
    const { host, guest, state } = await startGame(server)
    const turnIdx = state.turnIndex
    const activeClient = turnIdx === 0 ? host : guest

    // Force hasDiscarded = true in DB
    const row = server.db.prepare('SELECT * FROM rooms').get() as { code: string; state_json: string }
    const s = JSON.parse(row.state_json) as typeof state
    s.players[turnIdx]!.hasDiscarded = true
    server.db.prepare('UPDATE rooms SET state_json = ? WHERE code = ?').run(JSON.stringify(s), row.code)

    const chip = state.players[turnIdx]!.hand[0]!
    const err = await new Promise<{ code: string }>((resolve) => {
      activeClient.on('error', resolve)
      activeClient.emit('discard_chip', { chip })
    })
    expect(err.code).toBe('ALREADY_DISCARDED')
    host.disconnect()
    guest.disconnect()
  })
})
```

- [ ] **Step 8.2: Run — expect FAIL**

```bash
pnpm test -- src/__tests__/turn-actions.test.ts
```

Expected: FAIL (stubs emit nothing).

- [ ] **Step 8.3: Implement packages/server/src/handlers/exchange-chips.ts**

```typescript
import type { ExchangeChipsPayload, GameState } from '@town77/shared-types'
import { canExchange, doExchange, SeededRNG } from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function exchangeChipsHandler(io: Io, socket: Sock, db: Db) {
  return (payload: ExchangeChipsPayload) => {
    const { playerId, roomCode } = socket.data
    if (!playerId || !roomCode) {
      socket.emit('error', { code: 'NOT_IN_ROOM', messageKey: 'errors.not_in_room' })
      return
    }

    const roomRow = getRoom(db, roomCode)
    if (!roomRow) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', messageKey: 'errors.room_not_found' })
      return
    }

    const state: GameState = JSON.parse(roomRow.state_json) as GameState

    if (state.phase !== 'playing') {
      socket.emit('error', { code: 'GAME_NOT_ACTIVE', messageKey: 'errors.game_not_active' })
      return
    }

    const currentPlayer = state.players[state.turnIndex]
    if (!currentPlayer || currentPlayer.id !== playerId) {
      socket.emit('error', { code: 'NOT_YOUR_TURN', messageKey: 'errors.not_your_turn' })
      return
    }

    if (!canExchange(currentPlayer.hand, payload.chips, state.config.exchange)) {
      socket.emit('error', { code: 'INVALID_EXCHANGE', messageKey: 'errors.invalid_exchange' })
      return
    }

    const rng = new SeededRNG(state.seed ^ Date.now())
    const { newHand, newBag } = doExchange(currentPlayer.hand, state.bag, payload.chips, rng)

    const nextTurnIndex = (state.turnIndex + 1) % state.players.length
    const updatedState: GameState = {
      ...state,
      bag: newBag,
      players: state.players.map((p, i) =>
        i === state.turnIndex ? { ...p, hand: newHand } : p,
      ),
      turnIndex: nextTurnIndex,
    }

    updateRoomState(db, roomCode, updatedState)
    logger.info({ roomCode, playerId, count: payload.chips.length }, 'chips.exchanged')
    io.to(roomCode).emit('state_update', { state: updatedState })
  }
}
```

- [ ] **Step 8.4: Implement packages/server/src/handlers/discard-chip.ts**

```typescript
import type { DiscardChipPayload, GameState } from '@town77/shared-types'
import { canDiscard, doDiscard } from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function discardChipHandler(io: Io, socket: Sock, db: Db) {
  return (payload: DiscardChipPayload) => {
    const { playerId, roomCode } = socket.data
    if (!playerId || !roomCode) {
      socket.emit('error', { code: 'NOT_IN_ROOM', messageKey: 'errors.not_in_room' })
      return
    }

    const roomRow = getRoom(db, roomCode)
    if (!roomRow) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', messageKey: 'errors.room_not_found' })
      return
    }

    const state: GameState = JSON.parse(roomRow.state_json) as GameState

    if (state.phase !== 'playing') {
      socket.emit('error', { code: 'GAME_NOT_ACTIVE', messageKey: 'errors.game_not_active' })
      return
    }

    const currentPlayer = state.players[state.turnIndex]
    if (!currentPlayer || currentPlayer.id !== playerId) {
      socket.emit('error', { code: 'NOT_YOUR_TURN', messageKey: 'errors.not_your_turn' })
      return
    }

    if (!canDiscard(currentPlayer.hasDiscarded)) {
      socket.emit('error', { code: 'ALREADY_DISCARDED', messageKey: 'errors.already_discarded' })
      return
    }

    const chipInHand = currentPlayer.hand.some(
      (h) => h.color === payload.chip.color && h.shape === payload.chip.shape,
    )
    if (!chipInHand) {
      socket.emit('error', { code: 'INVALID_DISCARD', messageKey: 'errors.invalid_discard' })
      return
    }

    const { newHand, newBag } = doDiscard(currentPlayer.hand, state.bag, payload.chip)

    const nextTurnIndex = (state.turnIndex + 1) % state.players.length
    const updatedState: GameState = {
      ...state,
      bag: newBag,
      players: state.players.map((p, i) =>
        i === state.turnIndex ? { ...p, hand: newHand, hasDiscarded: true } : p,
      ),
      turnIndex: nextTurnIndex,
    }

    updateRoomState(db, roomCode, updatedState)
    logger.info({ roomCode, playerId }, 'chip.discarded')
    io.to(roomCode).emit('state_update', { state: updatedState })
  }
}
```

- [ ] **Step 8.5: Run — expect PASS**

```bash
pnpm test -- src/__tests__/turn-actions.test.ts
```

Expected: all 4 turn-actions tests green.

- [ ] **Step 8.6: Run full suite**

```bash
pnpm test
```

Expected: all server tests pass.

- [ ] **Step 8.7: Commit**

```bash
git add packages/server/src/handlers/exchange-chips.ts packages/server/src/handlers/discard-chip.ts packages/server/src/__tests__/turn-actions.test.ts
git commit -m "feat(server): handlers exchange_chips y discard_chip"
```

---

## Task 9: Server entry point

**Files:**
- Create: `packages/server/src/index.ts`

- [ ] **Step 9.1: Create packages/server/src/index.ts**

```typescript
import http from 'http'
import { Server } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@town77/shared-types'
import { createApp, wireHandlers } from './app'
import { openDatabase } from './db/client'
import { logger } from './logger'

const PORT = parseInt(process.env.PORT ?? '3001', 10)
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
  logger.info('server.shutdown')
  httpServer.close(() => {
    db.close()
    process.exit(0)
  })
})
```

- [ ] **Step 9.2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9.3: Build**

```bash
pnpm build
```

Expected: `dist/index.js` created. No errors.

- [ ] **Step 9.4: Run full test suite one final time**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 9.5: Commit**

```bash
git add packages/server/src/index.ts
git commit -m "feat(server): punto de entrada del servidor HTTP y Socket.IO"
```

---

## Task 10: Docker + compose

**Files:**
- Create: `packages/server/Dockerfile`
- Create: `docker-compose.yml`
- Create: `docker-compose.dev.yml`

All commands run from `town77/` root.

- [ ] **Step 10.1: Create packages/server/Dockerfile**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app

# Build tools for better-sqlite3 native module
RUN apk add --no-cache python3 make g++ && corepack enable pnpm

# Install dependencies (layer-cached separately from source)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/game-engine/package.json packages/game-engine/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY packages/shared-types/src packages/shared-types/src
COPY packages/game-engine/src packages/game-engine/src
COPY packages/server/src packages/server/src
RUN pnpm --filter @town77/shared-types run build \
 && pnpm --filter @town77/game-engine run build \
 && pnpm --filter @town77/server run build

# Production image — only runtime artefacts
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache python3 make g++ && corepack enable pnpm

# Copy manifests (needed for module resolution)
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/game-engine/package.json packages/game-engine/
COPY packages/server/package.json packages/server/

# Install production deps only (re-compiles better-sqlite3 for this Alpine)
RUN pnpm install --frozen-lockfile --prod

# Copy built dist from builder
COPY --from=builder /app/packages/shared-types/dist packages/shared-types/dist
COPY --from=builder /app/packages/game-engine/dist packages/game-engine/dist
COPY --from=builder /app/packages/server/dist packages/server/dist

ENV NODE_ENV=production
EXPOSE 3001
VOLUME ["/data"]

CMD ["node", "packages/server/dist/index.js"]
```

- [ ] **Step 10.2: Create docker-compose.yml** (production)

```yaml
services:
  server:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
      target: production
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: "3001"
      DB_PATH: /data/town77.db
      LOG_LEVEL: info
      CORS_ORIGIN: "*"
    volumes:
      - sqlite_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  sqlite_data:
```

- [ ] **Step 10.3: Create docker-compose.dev.yml** (hot reload)

```yaml
services:
  server:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
      target: builder
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      PORT: "3001"
      DB_PATH: /data/town77-dev.db
      LOG_LEVEL: debug
      CORS_ORIGIN: "*"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/packages/shared-types/node_modules
      - /app/packages/game-engine/node_modules
      - /app/packages/server/node_modules
      - sqlite_data_dev:/data
    command: ["pnpm", "--filter", "@town77/server", "run", "dev"]
    restart: unless-stopped

volumes:
  sqlite_data_dev:
```

- [ ] **Step 10.4: Build production image**

```bash
docker build -f packages/server/Dockerfile --target production -t town77-server:latest .
```

Expected: Build succeeds. Image tagged `town77-server:latest`.

- [ ] **Step 10.5: Smoke-test the container**

```bash
docker run --rm -e PORT=3001 -e DB_PATH=/tmp/test.db -p 3001:3001 town77-server:latest &
sleep 3
curl -s http://localhost:3001/health
```

Expected output: `{"ok":true}`

Kill the background container after verifying:

```bash
docker ps -q --filter ancestor=town77-server:latest | xargs docker stop
```

- [ ] **Step 10.6: Commit**

```bash
git add packages/server/Dockerfile docker-compose.yml docker-compose.dev.yml
git commit -m "feat(server): Dockerfile y docker-compose — servidor containerizado"
```

---

## Phase 2 Complete

At this point:
- `@town77/server` — fully-tested WebSocket game server:
  - `create_room`, `join_room` (with session recovery), `start_game`, `place_chip`, `exchange_chips`, `discard_chip`
  - SQLite persistence via better-sqlite3 — every state mutation written immediately
  - pino structured JSON logging
  - `/health` endpoint
- Docker multi-stage image — production + dev hot-reload compose files
- Test suite: ~30 integration tests using real Socket.IO + in-memory SQLite

**Next:** Phase 3 — Client Foundation (React 18 + Vite + Zustand + i18next + Framer Motion)
