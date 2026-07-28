import { randomInt } from 'crypto'
import type { AnyGameState, CafeQueueConfig, CreateRoomPayload, GameConfig, GameState } from '@town77/shared-types'
import { createCafeQueueState, initBag, createGrid, SeededRNG } from '@town77/game-engine'
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

export function createRoomHandler(_io: Io, socket: Sock, db: Db, presence = new PresenceRegistry()) {
  return (payload: CreateRoomPayload) => {
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

    let state: AnyGameState
    try {
      if (isCafeQueueConfig(config)) {
        if (!isValidCafeQueueConfig(config)) {
          throw new Error('invalid cafe queue config')
        }
        state = createCafeQueueState(config, [{ id: playerId, name: playerName }], seed)
      } else {
        const rng = new SeededRNG(seed)
        const bag = initBag(config.chips, rng, config.grid.rows * config.grid.cols + config.handSize)
        state = {
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
        } satisfies GameState
      }
    } catch {
      socket.emit('error', { code: 'VALIDATION_ERROR', messageKey: 'errors.invalid_config' })
      return
    }

    try {
      runInTransaction(db, () => {
        createRoom(db, { code, themeId, config, state, seed })
        createPlayer(db, { id: playerId, roomCode: code, name: playerName, sessionToken })
      })
    } catch (err) {
      logger.error(
        { roomCode: code, playerId, error: (err as Error).message },
        'room.create_failed',
      )
      socket.emit('error', { code: 'INTERNAL_ERROR', messageKey: 'errors.internal' })
      return
    }

    socket.data = { playerId, roomCode: code }
    presence.connect(playerId, socket.id)
    void socket.join(code)

    logger.info({ roomCode: code, playerId, playerName }, 'room.created')
    socket.emit('room_joined', { code, playerId, sessionToken, state: projectStateForPlayer(state, playerId) as GameState })
  }
}

function isCafeQueueConfig(config: GameConfig | CafeQueueConfig): config is CafeQueueConfig {
  return 'gameId' in config && config.gameId === 'cafe-queue'
}

function isValidCafeQueueConfig(config: CafeQueueConfig): boolean {
  if (!Number.isInteger(config.rows) || !Number.isInteger(config.cols) || config.rows < 1 || config.cols < 1) return false
  if (!Number.isInteger(config.minPlayers) || !Number.isInteger(config.maxPlayers) || config.minPlayers < 1 || config.maxPlayers < config.minPlayers) return false
  if (!Number.isInteger(config.cupsPerPlayer) || config.cupsPerPlayer < 1) return false
  if (!Number.isInteger(config.normalMoveLimit) || config.normalMoveLimit < 1) return false
  if (!Number.isInteger(config.rushSupply) || config.rushSupply < 0) return false

  const ingredients = ['beans', 'milk', 'steam', 'ice', 'chocolate', 'caramel', 'tea', 'water'] as const
  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const ingredient = config.board[`r${row}c${col}`]
      if (ingredient === undefined || !ingredients.includes(ingredient)) return false
    }
  }
  return ingredients.every((ingredient) => Number.isInteger(config.ingredientSupply[ingredient]) && config.ingredientSupply[ingredient] >= 0)
}
