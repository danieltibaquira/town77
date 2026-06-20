import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import type { Chip } from '@town77/shared-types'
import { createGrid } from '@town77/game-engine'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import { renderWithTheme } from './helpers'
import { GameScreen } from '../screens/GameScreen'
import { useGameStore } from '../store/gameStore'

const RED_COTTAGE: Chip = { color: 'color-1', shape: 'cottage' }
const RED_TOWER: Chip = { color: 'color-1', shape: 'tower' }
const RED_BARN: Chip = { color: 'color-1', shape: 'barn' }
const BLUE_COTTAGE: Chip = { color: 'color-2', shape: 'cottage' }

function setup(hand: Chip[], selectedChip: Chip | null) {
  useGameStore.getState().disconnect()
  useGameStore.setState({
    gameState: {
      grid: createGrid(7, 7),
      bag: [],
      players: [{ id: 'p1', name: 'Alice', hand, placed: 0, hasDiscarded: false, connected: true }],
      turnIndex: 0,
      phase: 'playing',
      config: DEFAULT_GAME_CONFIG,
      themeId: 'town77',
      seed: 42,
    },
    playerId: 'p1',
    connected: true,
    selectedChip,
  })
}

describe('GameScreen exchange wiring', () => {
  beforeEach(() => {
    setup([], null)
  })

  it('enables exchange when the selected chip has >= min of its color', () => {
    setup([RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE], RED_COTTAGE)
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('btn-exchange')).toBeEnabled()
  })

  it('disables exchange when fewer than min of the selected color', () => {
    setup([RED_COTTAGE, RED_TOWER, BLUE_COTTAGE], RED_COTTAGE)
    renderWithTheme(<GameScreen />)
    expect(screen.getByTestId('btn-exchange')).toBeDisabled()
  })

  it('exchanges the selected chip color group on click', () => {
    const exchangeChips = vi.fn()
    setup([RED_COTTAGE, RED_TOWER, RED_BARN, BLUE_COTTAGE], RED_COTTAGE)
    useGameStore.setState({ exchangeChips })
    renderWithTheme(<GameScreen />)
    fireEvent.click(screen.getByTestId('btn-exchange'))
    expect(exchangeChips).toHaveBeenCalledWith([RED_COTTAGE, RED_TOWER, RED_BARN])
  })
})
