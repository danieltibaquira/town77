import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import type { CafeQueueConfig, CafeQueueState } from '@town77/shared-types'
import { renderWithTheme } from '../helpers'

const sendCafeQueueAction = vi.fn()
const config: CafeQueueConfig = {
  gameId: 'cafe-queue', minPlayers: 2, maxPlayers: 4, rows: 4, cols: 4, cupsPerPlayer: 3, normalMoveLimit: 3,
  board: { r0c0: 'beans', r0c1: 'milk', r0c2: 'steam', r0c3: 'ice', r1c0: 'water', r1c1: 'tea', r1c2: 'chocolate', r1c3: 'caramel', r2c0: 'milk', r2c1: 'steam', r2c2: 'ice', r2c3: 'beans', r3c0: 'tea', r3c1: 'water', r3c2: 'caramel', r3c3: 'chocolate' },
  ingredientSupply: { beans: 18, milk: 12, steam: 12, ice: 12, chocolate: 12, caramel: 12, tea: 12, water: 12 }, rushSupply: 15,
}

vi.mock('../../store/gameStore', () => ({
  useGameStore: (selector: (state: { sendCafeQueueAction: typeof sendCafeQueueAction }) => unknown) => selector({ sendCafeQueueAction }),
}))

import { CafeQueueGameScreen } from '../../screens/CafeQueueGameScreen'

describe('CafeQueueGameScreen', () => {
  let state: CafeQueueState

  beforeEach(() => {
    sendCafeQueueAction.mockReset()
    state = {
      gameId: 'cafe-queue', phase: 'playing', config, themeId: 'neobrutalism', seed: 1,
      turnIndex: 0, startingPlayerIndex: 0, closeArmed: false, orderDeck: [], ingredientSupply: { ...config.ingredientSupply }, rushSupply: 15,
      players: [
        { id: 'p1', name: 'Ada', connected: true, meeplePositions: ['r0c0', 'r0c1'], cups: [{ ingredients: {} }, { ingredients: {} }, { ingredients: {} }], collectedThisTurn: {}, hasMovedThisTurn: false, orderTabs: [[], [], [], []], completedOrders: [], completedThisTurn: 0, penaltyOrders: [], activeUpgrades: [], rushTokens: 0 },
        { id: 'p2', name: 'Bea', connected: true, meeplePositions: ['r0c2', 'r0c3'], cups: [{ ingredients: {} }, { ingredients: {} }, { ingredients: {} }], collectedThisTurn: {}, hasMovedThisTurn: false, orderTabs: [[], [], [], []], completedOrders: [], completedThisTurn: 0, penaltyOrders: [], activeUpgrades: [], rushTokens: 0 },
      ],
    }
  })

  it('renders the ingredient board and sends only a legal movement intent', () => {
    renderWithTheme(<CafeQueueGameScreen state={state} playerId="p1" roomCode="ABC123" />)

    expect(screen.getByTestId('cafe-queue-board')).toBeDefined()
    expect(screen.getByTestId('cafe-cell-r1c0')).not.toBeDisabled()
    fireEvent.click(screen.getByTestId('cafe-cell-r1c0'))
    expect(sendCafeQueueAction).toHaveBeenCalledWith({ type: 'move_meeple', meepleIndex: 0, path: ['r1c0'], rushSpent: 0 })
  })

  it('disables end turn for a non-current player', () => {
    renderWithTheme(<CafeQueueGameScreen state={state} playerId="p2" roomCode="ABC123" />)

    expect(screen.getByTestId('cafe-end-turn')).toBeDisabled()
  })
})
