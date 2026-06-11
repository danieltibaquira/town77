import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../store/gameStore'

// Mock socket
vi.mock('../lib/socket', () => {
  const emit = vi.fn()
  const connect = vi.fn()
  const disconnect = vi.fn()
  const on = vi.fn()
  const removeAllListeners = vi.fn()
  return {
    socket: { emit, connect, disconnect, on, removeAllListeners },
  }
})

import { socket } from '../lib/socket'

describe('gameStore emit actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useGameStore.setState({
      gameState: null,
      playerId: null,
      sessionToken: null,
      roomCode: null,
      selectedChip: null,
      lastError: null,
      scores: null,
      connected: false,
    })
  })

  it('createRoom emits create_room with config, themeId, playerName', () => {
    const { createRoom } = useGameStore.getState()
    const config = {
      grid: { rows: 7, cols: 7 },
      chips: { colors: ['color-1'], shapes: ['cottage'], copies: 1 },
      handSize: 4,
      scoring: { placedWeight: 1, remainingWeight: 1 },
      exchange: { min: 3, max: 4 },
    }
    createRoom(config, 'town77', 'Alice')
    expect(socket.emit).toHaveBeenCalledWith('create_room', {
      config,
      themeId: 'town77',
      playerName: 'Alice',
    })
  })

  it('joinRoom emits join_room with code, playerName', () => {
    const { joinRoom } = useGameStore.getState()
    joinRoom('ABC123', 'Bob')
    expect(socket.emit).toHaveBeenCalledWith('join_room', {
      code: 'ABC123',
      playerName: 'Bob',
    })
  })

  it('joinRoom with sessionToken includes it', () => {
    const { joinRoom } = useGameStore.getState()
    joinRoom('ABC123', 'Bob', 'player-1', 'tok-123')
    expect(socket.emit).toHaveBeenCalledWith('join_room', {
      code: 'ABC123',
      playerName: 'Bob',
      playerId: 'player-1',
      sessionToken: 'tok-123',
    })
  })

  it('startGame emits start_game', () => {
    const { startGame } = useGameStore.getState()
    startGame()
    expect(socket.emit).toHaveBeenCalledWith('start_game')
  })

  it('placeChip emits place_chip with chip, row, col', () => {
    const { placeChip } = useGameStore.getState()
    const chip = { color: 'color-1', shape: 'cottage' }
    placeChip(chip, 3, 4)
    expect(socket.emit).toHaveBeenCalledWith('place_chip', {
      chip,
      row: 3,
      col: 4,
    })
  })

  it('exchangeChips emits exchange_chips with chips array', () => {
    const { exchangeChips } = useGameStore.getState()
    const chips = [{ color: 'color-1', shape: 'cottage' }]
    exchangeChips(chips)
    expect(socket.emit).toHaveBeenCalledWith('exchange_chips', { chips })
  })

  it('discardChip emits discard_chip with chip', () => {
    const { discardChip } = useGameStore.getState()
    const chip = { color: 'color-2', shape: 'tower' }
    discardChip(chip)
    expect(socket.emit).toHaveBeenCalledWith('discard_chip', { chip })
  })
})
