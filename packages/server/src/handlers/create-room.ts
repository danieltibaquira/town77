import { randomInt } from 'crypto'
import { SeededRNG, createGrid, initBag } from '@town77/game-engine'
import type { CreateRoomPayload, GameState } from '@town77/shared-types'
import type { Db, Io, Sock } from '../app'
import { createPlayer } from '../db/players'
import { createRoom } from '../db/rooms'
import { logger } from '../logger'
import { generateRoomCode } from '../room/code'
import { generatePlayerId, generateSessionToken } from '../room/session'

export function createRoomHandler(_io: Io, socket: Sock, db: Db) {
  return (payload: CreateRoomPayload) => {
    const { config, themeId, playerName } = payload

    const code = generateRoomCode()
    const seed = payload.seed ?? randomInt(0, 2 ** 31)
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
