import { randomInt } from 'crypto'
import type { GameState } from '@town77/shared-types'
import { dealHands, findBotAction, getValidCells, isFirstChipOnGrid, isValidPlacement, applyPlacement, drawChips, calculateScores, isGameOver, doExchange, SeededRNG } from '@town77/game-engine'
import { getRoom, updateRoomState } from '../db/rooms'
import { logger } from '../logger'
import type { Io, Sock, Db } from '../app'

export function startSoloGameHandler(io: Io, socket: Sock, db: Db) {
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
    if (state.phase !== 'lobby') {
      socket.emit('error', { code: 'ALREADY_STARTED', messageKey: 'errors.already_started' })
      return
    }

    const { hands, remainingBag } = dealHands(state.bag, state.players.length, state.config.handSize)
    const firstPlayerIndex = state.seed % state.players.length

    const updatedState: GameState = {
      ...state,
      bag: remainingBag,
      players: state.players.map((p, i) => ({ ...p, hand: hands[i] ?? [] })),
      turnIndex: firstPlayerIndex,
      phase: 'playing',
    }

    updateRoomState(db, roomCode, updatedState)
    logger.info({ roomCode, firstPlayerIndex }, 'solo.game.started')
    io.to(roomCode).emit('state_update', { state: updatedState })

    // If bot goes first, trigger its turn
    const botPlayer = updatedState.players[firstPlayerIndex]
    if (botPlayer && botPlayer.id.startsWith('bot-')) {
      setTimeout(() => runBotTurn(io, db, roomCode, updatedState), 1000)
    }
  }
}

export function runBotTurn(io: Io, db: Db, roomCode: string, currentState: GameState): void {
  const botPlayer = currentState.players[currentState.turnIndex]
  if (!botPlayer || !botPlayer.id.startsWith('bot-')) return

  const action = findBotAction(currentState, botPlayer.id)
  if (!action) {
    // Bot passes — just advance turn
    const nextTurnIndex = (currentState.turnIndex + 1) % currentState.players.length
    const passedState: GameState = { ...currentState, turnIndex: nextTurnIndex }
    updateRoomState(db, roomCode, passedState)
    io.to(roomCode).emit('state_update', { state: passedState })
    return
  }

  if (action.type === 'place') {
    const { chip, row, col } = action
    const chipIdx = botPlayer.hand.findIndex(
      (h) => h.color === chip.color && h.shape === chip.shape,
    )
    if (chipIdx === -1) {
      // Should not happen, but handle gracefully
      const nextTurnIndex = (currentState.turnIndex + 1) % currentState.players.length
      const passedState: GameState = { ...currentState, turnIndex: nextTurnIndex }
      updateRoomState(db, roomCode, passedState)
      io.to(roomCode).emit('state_update', { state: passedState })
      return
    }

    const isFirst = isFirstChipOnGrid(currentState.grid)
    if (!isValidPlacement(currentState.grid, row, col, chip, isFirst)) {
      // Invalid placement — bot passes
      const nextTurnIndex = (currentState.turnIndex + 1) % currentState.players.length
      const passedState: GameState = { ...currentState, turnIndex: nextTurnIndex }
      updateRoomState(db, roomCode, passedState)
      io.to(roomCode).emit('state_update', { state: passedState })
      return
    }

    const newGrid = applyPlacement(currentState.grid, row, col, chip)
    const handWithout = [
      ...botPlayer.hand.slice(0, chipIdx),
      ...botPlayer.hand.slice(chipIdx + 1),
    ]

    const { drawn, remainingBag } = drawChips(currentState.bag, 1)
    const newHand = [...handWithout, ...drawn]

    const updatedPlayers = currentState.players.map((p, i) =>
      i === currentState.turnIndex ? { ...p, hand: newHand, placed: p.placed + 1 } : p,
    )

    const nextTurnIndex = (currentState.turnIndex + 1) % currentState.players.length

    const updatedState: GameState = {
      ...currentState,
      grid: newGrid,
      bag: remainingBag,
      players: updatedPlayers,
      turnIndex: nextTurnIndex,
    }

    if (isGameOver(updatedState.grid, updatedState.bag, updatedState.players)) {
      const finalState: GameState = { ...updatedState, phase: 'finished' }
      updateRoomState(db, roomCode, finalState)
      const scores = calculateScores(finalState.players, finalState.config.scoring)
      logger.info({ roomCode, scores }, 'solo.game.over')
      io.to(roomCode).emit('game_over', { scores })
      return
    }

    updateRoomState(db, roomCode, updatedState)
    logger.info({ roomCode, botId: botPlayer.id, row, col }, 'bot.placed')
    io.to(roomCode).emit('state_update', { state: updatedState })

    // If next turn is also bot, chain it
    const nextPlayer = updatedState.players[nextTurnIndex]
    if (nextPlayer && nextPlayer.id.startsWith('bot-')) {
      setTimeout(() => runBotTurn(io, db, roomCode, updatedState), 1000)
    }
  } else if (action.type === 'discard') {
    const chipIdx = botPlayer.hand.findIndex(
      (h) => h.color === action.chip.color && h.shape === action.chip.shape,
    )
    if (chipIdx === -1) {
      const nextTurnIndex = (currentState.turnIndex + 1) % currentState.players.length
      const passedState: GameState = { ...currentState, turnIndex: nextTurnIndex }
      updateRoomState(db, roomCode, passedState)
      io.to(roomCode).emit('state_update', { state: passedState })
      return
    }

    const newHand = [
      ...botPlayer.hand.slice(0, chipIdx),
      ...botPlayer.hand.slice(chipIdx + 1),
    ]
    const newBag = [...currentState.bag]
    let drew = false
    if (newBag.length > 0) {
      const drawn = newBag.splice(0, 1)[0]!
      newHand.push(drawn)
      drew = true
    }

    const updatedPlayers = currentState.players.map((p, i) =>
      i === currentState.turnIndex ? { ...p, hand: newHand, hasDiscarded: true } : p,
    )

    const nextTurnIndex = (currentState.turnIndex + 1) % currentState.players.length
    const updatedState: GameState = {
      ...currentState,
      bag: newBag,
      players: updatedPlayers,
      turnIndex: nextTurnIndex,
    }

    updateRoomState(db, roomCode, updatedState)
    logger.info({ roomCode, botId: botPlayer.id, drew }, 'bot.discarded')
    io.to(roomCode).emit('state_update', { state: updatedState })

    const nextPlayer = updatedState.players[nextTurnIndex]
    if (nextPlayer && nextPlayer.id.startsWith('bot-')) {
      setTimeout(() => runBotTurn(io, db, roomCode, updatedState), 1000)
    }
  } else if (action.type === 'exchange') {
    const rng = new SeededRNG(currentState.seed + currentState.turnIndex)
    const { newHand, newBag } = doExchange(botPlayer.hand, currentState.bag, action.chips, rng)

    const updatedPlayers = currentState.players.map((p, i) =>
      i === currentState.turnIndex ? { ...p, hand: newHand } : p,
    )

    const nextTurnIndex = (currentState.turnIndex + 1) % currentState.players.length
    const updatedState: GameState = {
      ...currentState,
      bag: newBag,
      players: updatedPlayers,
      turnIndex: nextTurnIndex,
    }

    updateRoomState(db, roomCode, updatedState)
    logger.info({ roomCode, botId: botPlayer.id, count: action.chips.length }, 'bot.exchanged')
    io.to(roomCode).emit('state_update', { state: updatedState })

    const nextPlayer = updatedState.players[nextTurnIndex]
    if (nextPlayer && nextPlayer.id.startsWith('bot-')) {
      setTimeout(() => runBotTurn(io, db, roomCode, updatedState), 1000)
    }
  }
}
