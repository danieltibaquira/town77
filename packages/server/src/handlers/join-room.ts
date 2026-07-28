import type { AnyGameState, CafeQueueState, GameState, JoinRoomPayload } from '@town77/shared-types'
import { isCafeQueueState } from '@town77/shared-types'
import { createCafeQueueState } from '@town77/game-engine'
import { createPlayer, getPlayerByToken } from '../db/players'
import { getRoom, updateRoomState } from '../db/rooms'
import { runInTransaction } from '../db/transactions'
import { generateSessionToken, generatePlayerId } from '../room/session'
import { validatePlayerName } from '../room/validate'
import { logger } from '../logger'
import { emitStateToRoom } from '../state/broadcast'
import { projectStateForPlayer } from '../state/projection'
import { PresenceRegistry } from '../socket/presence'
import type { Io, Sock, Db } from '../app'

export function joinRoomHandler(_io: Io, socket: Sock, db: Db, presence = new PresenceRegistry()) {
  return (payload: JoinRoomPayload) => {
    const { code, playerName, sessionToken } = payload

    const roomRow = getRoom(db, code)
    if (!roomRow) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', messageKey: 'errors.room_not_found' })
      return
    }

    const parsedState = JSON.parse(roomRow.state_json) as AnyGameState
    if (isCafeQueueState(parsedState)) {
      joinCafeQueueRoom(_io, socket, db, presence, payload, parsedState)
      return
    }
    const state: GameState = parsedState

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
        presence.connect(playerRow.id, socket.id)
        void socket.join(code)

        logger.info({ roomCode: code, playerId: playerRow.id }, 'player.reconnected')
        socket.emit('room_joined', {
          code,
          playerId: playerRow.id,
          sessionToken,
          state: projectStateForPlayer(updatedState, playerRow.id) as GameState,
        })
        emitStateToRoom(_io, code, updatedState, socket.id)
        return
      }
    }

    // --- New player ---
    if (state.phase !== 'lobby') {
      socket.emit('error', { code: 'GAME_IN_PROGRESS', messageKey: 'errors.game_in_progress' })
      return
    }
    const max = state.config.maxPlayers ?? 5
    if (state.players.length >= max) {
      socket.emit('error', { code: 'ROOM_FULL', messageKey: 'errors.room_full' })
      return
    }

    const name = validatePlayerName(playerName)
    if (!name) {
      socket.emit('error', { code: 'VALIDATION_ERROR', messageKey: 'errors.invalid_name' })
      return
    }

    const playerId = generatePlayerId()
    const newToken = generateSessionToken()

    const updatedState: GameState = {
      ...state,
      players: [
        ...state.players,
        { id: playerId, name, hand: [], placed: 0, hasDiscarded: false, connected: true },
      ],
    }

    try {
      runInTransaction(db, () => {
        updateRoomState(db, code, updatedState)
        createPlayer(db, { id: playerId, roomCode: code, name, sessionToken: newToken })
      })
    } catch (err) {
      logger.error(
        { roomCode: code, playerId, error: (err as Error).message },
        'player.join_failed',
      )
      socket.emit('error', { code: 'INTERNAL_ERROR', messageKey: 'errors.internal' })
      return
    }

    socket.data = { playerId, roomCode: code }
    presence.connect(playerId, socket.id)
    void socket.join(code)

    logger.info({ roomCode: code, playerId, playerName }, 'player.joined')
    socket.emit('room_joined', {
      code,
      playerId,
      sessionToken: newToken,
      state: projectStateForPlayer(updatedState, playerId) as GameState,
    })
    emitStateToRoom(_io, code, updatedState, socket.id)
  }
}

function joinCafeQueueRoom(
  io: Io,
  socket: Sock,
  db: Db,
  presence: PresenceRegistry,
  payload: JoinRoomPayload,
  state: CafeQueueState,
): void {
  const { code, playerName, sessionToken } = payload
  if (sessionToken) {
    const playerRow = getPlayerByToken(db, sessionToken)
    if (playerRow && playerRow.room_code === code) {
      const updatedState: CafeQueueState = {
        ...state,
        players: state.players.map((player) => player.id === playerRow.id ? { ...player, connected: true } : player),
      }
      updateRoomState(db, code, updatedState)
      socket.data = { playerId: playerRow.id, roomCode: code }
      presence.connect(playerRow.id, socket.id)
      void socket.join(code)
      socket.emit('room_joined', { code, playerId: playerRow.id, sessionToken, state: projectStateForPlayer(updatedState, playerRow.id) as GameState })
      emitStateToRoom(io, code, updatedState, socket.id)
      return
    }
  }

  if (state.phase !== 'lobby') {
    socket.emit('error', { code: 'GAME_IN_PROGRESS', messageKey: 'errors.game_in_progress' })
    return
  }
  if (state.players.length >= state.config.maxPlayers) {
    socket.emit('error', { code: 'ROOM_FULL', messageKey: 'errors.room_full' })
    return
  }
  const name = validatePlayerName(playerName)
  if (!name) {
    socket.emit('error', { code: 'VALIDATION_ERROR', messageKey: 'errors.invalid_name' })
    return
  }

  const playerId = generatePlayerId()
  const newToken = generateSessionToken()
  const setupPlayers = [...state.players.map((player) => ({ id: player.id, name: player.name })), { id: playerId, name }]
  const rebuilt = createCafeQueueState(state.config, setupPlayers, state.seed)
  const updatedState: CafeQueueState = {
    ...rebuilt,
    themeId: state.themeId,
    players: rebuilt.players.map((player) => ({
      ...player,
      connected: player.id === playerId || state.players.find((existing) => existing.id === player.id)?.connected === true,
    })),
  }

  try {
    runInTransaction(db, () => {
      updateRoomState(db, code, updatedState)
      createPlayer(db, { id: playerId, roomCode: code, name, sessionToken: newToken })
    })
  } catch (err) {
    logger.error({ roomCode: code, playerId, error: (err as Error).message }, 'cafe_queue.player.join_failed')
    socket.emit('error', { code: 'INTERNAL_ERROR', messageKey: 'errors.internal' })
    return
  }

  socket.data = { playerId, roomCode: code }
  presence.connect(playerId, socket.id)
  void socket.join(code)
  socket.emit('room_joined', { code, playerId, sessionToken: newToken, state: projectStateForPlayer(updatedState, playerId) as GameState })
  emitStateToRoom(io, code, updatedState, socket.id)
}
