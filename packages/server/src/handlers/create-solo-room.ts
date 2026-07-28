import { randomInt } from 'crypto'
import type { GameState, TilePlacementCreateRoomPayload } from '@town77/shared-types'
import { initBag, createGrid, SeededRNG } from '@town77/game-engine'
import { createRoom } from '../db/rooms'
import { createPlayer } from '../db/players'
import { runInTransaction } from '../db/transactions'
import { generateRoomCode } from '../room/code'
import { generateSessionToken, generatePlayerId } from '../room/session'
import { validatePlayerName } from '../room/validate'
import { logger } from '../logger'
import { projectStateForPlayer } from '../state/projection'
import { PresenceRegistry } from '../socket/presence'
import type { Io, Sock, Db } from '../app'

export function createSoloRoomHandler(_io: Io, socket: Sock, db: Db, presence = new PresenceRegistry()) {
  return (payload: TilePlacementCreateRoomPayload) => {
    const { config, themeId } = payload

    const playerName = validatePlayerName(payload.playerName)
    if (!playerName) {
      socket.emit('error', { code: 'VALIDATION_ERROR', messageKey: 'errors.invalid_name' })
      return
    }

    const code = generateRoomCode()
    const seed = payload.seed ?? randomInt(0, 2 ** 31)
    const playerId = generatePlayerId()
    const sessionToken = generateSessionToken()
    const botId = `bot-${code}`

    const rng = new SeededRNG(seed)
    const bag = initBag(config.chips, rng, config.grid.rows * config.grid.cols + config.handSize)

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
        {
          id: botId,
          name: 'Bot',
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

    const botToken = generateSessionToken()
    try {
      runInTransaction(db, () => {
        createRoom(db, { code, themeId, config, state, seed })
        createPlayer(db, { id: playerId, roomCode: code, name: playerName, sessionToken })
        createPlayer(db, { id: botId, roomCode: code, name: 'Bot', sessionToken: botToken })
      })
    } catch (err) {
      logger.error(
        { roomCode: code, playerId, error: (err as Error).message },
        'solo.room.create_failed',
      )
      socket.emit('error', { code: 'INTERNAL_ERROR', messageKey: 'errors.internal' })
      return
    }

    socket.data = { playerId, roomCode: code }
    presence.connect(playerId, socket.id)
    void socket.join(code)

    logger.info({ roomCode: code, playerId, playerName }, 'solo.room.created')
    socket.emit('room_joined', { code, playerId, sessionToken, state: projectStateForPlayer(state, playerId) as GameState })
  }
}
