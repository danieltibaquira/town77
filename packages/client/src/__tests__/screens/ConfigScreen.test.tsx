import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfigScreen } from '../../screens/ConfigScreen'
import { renderWithTheme } from '../helpers'

// Mock store and router
vi.mock('../../store/gameStore', () => ({
  useGameStore: vi.fn((selector: any) => {
    const state = { createRoom: vi.fn(), connect: vi.fn(), disconnect: vi.fn() }
    return selector ? selector(state) : state
  }),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

describe('ConfigScreen', () => {
  it('renders with data-testid config-screen', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-screen')).toBeDefined()
  })

  it('shows grid size stepper', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-grid')).toBeDefined()
  })

  it('shows colors stepper', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-colors')).toBeDefined()
  })

  it('shows shapes stepper', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-shapes')).toBeDefined()
  })

  it('shows copies stepper', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-copies')).toBeDefined()
  })

  it('shows hand size stepper', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-hand-size')).toBeDefined()
  })

  it('displays total chips count', () => {
    renderWithTheme(<ConfigScreen />)
    // 7 colors × 7 shapes × 1 copy = 49
    expect(screen.getByTestId('config-total-chips')).toHaveTextContent('49')
  })

  it('displays board cells count', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('config-board-cells')).toHaveTextContent('49')
  })

  it('shows warning when chips < cells', async () => {
    renderWithTheme(<ConfigScreen />)
    // Set grid to 9x9 (81 cells) with 49 chips
    const gridStepper = screen.getByTestId('config-grid')
    const gridInc = gridStepper.querySelector('[data-testid="stepper-inc"]')!
    await userEvent.click(gridInc) // 7->8
    await userEvent.click(gridInc) // 8->9
    expect(screen.getByTestId('config-warning')).toBeDefined()
  })

  it('shows theme cards for available themes', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('theme-card-town77')).toBeDefined()
    expect(screen.getByTestId('theme-card-playful-pastel')).toBeDefined()
  })

  it('has a "Create room" button enabled by default (random name pre-filled)', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('btn-create-room')).not.toBeDisabled()
  })

  it('"Create room" stays enabled after typing a name', async () => {
    renderWithTheme(<ConfigScreen />)
    await userEvent.type(screen.getByTestId('input-player-name'), 'Alice')
    expect(screen.getByTestId('btn-create-room')).not.toBeDisabled()
  })

  it('shows quick preset buttons', () => {
    renderWithTheme(<ConfigScreen />)
    expect(screen.getByTestId('preset-classic')).toBeDefined()
    expect(screen.getByTestId('preset-fast')).toBeDefined()
  })

  it('clicking "Fast 5x5" preset sets board to 25 cells', async () => {
    renderWithTheme(<ConfigScreen />)
    await userEvent.click(screen.getByTestId('preset-fast'))
    expect(screen.getByTestId('config-board-cells')).toHaveTextContent('25')
  })
})
