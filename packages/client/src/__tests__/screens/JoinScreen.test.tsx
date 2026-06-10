import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../helpers'
import { JoinScreen } from '../../screens/JoinScreen'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock('../../store/gameStore', () => ({
  useGameStore: vi.fn((selector: any) => {
    const state = { joinRoom: vi.fn(), connect: vi.fn(), disconnect: vi.fn() }
    return selector ? selector(state) : state
  }),
}))

describe('JoinScreen', () => {
  it('renders with data-testid join-screen', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('join-screen')).toBeDefined()
  })

  it('has player name input', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('input-join-name')).toBeDefined()
  })

  it('has room code input', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('input-room-code')).toBeDefined()
  })

  it('join button disabled when fields empty', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('btn-join-room')).toBeDisabled()
  })

  it('join button enabled when both fields filled', async () => {
    renderWithTheme(<JoinScreen />)
    await userEvent.type(screen.getByTestId('input-join-name'), 'Bob')
    await userEvent.type(screen.getByTestId('input-room-code'), 'ABC123')
    expect(screen.getByTestId('btn-join-room')).not.toBeDisabled()
  })

  it('has a back button', () => {
    renderWithTheme(<JoinScreen />)
    expect(screen.getByTestId('btn-back')).toBeDefined()
  })
})
