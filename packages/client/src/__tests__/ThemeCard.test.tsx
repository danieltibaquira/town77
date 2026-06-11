import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeCard } from '../components/ThemeCard'
import { town77Theme } from '../themes/town77'
import { renderWithTheme } from './helpers'

describe('ThemeCard', () => {
  it('renders theme name', () => {
    renderWithTheme(<ThemeCard theme={town77Theme} isSelected={false} onClick={() => {}} />)
    expect(screen.getByText(town77Theme.name)).toBeDefined()
  })

  it('sets data-selected when selected', () => {
    renderWithTheme(<ThemeCard theme={town77Theme} isSelected onClick={() => {}} />)
    expect(screen.getByTestId(`theme-card-${town77Theme.id}`)).toHaveAttribute(
      'data-selected',
      'true',
    )
  })

  it('renders color swatches from palette', () => {
    renderWithTheme(<ThemeCard theme={town77Theme} isSelected={false} onClick={() => {}} />)
    const swatches = screen.getAllByTestId(/^theme-swatch-/)
    expect(swatches.length).toBe(7)
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    renderWithTheme(<ThemeCard theme={town77Theme} isSelected={false} onClick={onClick} />)
    await userEvent.click(screen.getByTestId(`theme-card-${town77Theme.id}`))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
