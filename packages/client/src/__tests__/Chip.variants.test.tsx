import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Chip } from '../components/Chip'
import { renderWithTheme } from './helpers'

const chip = { color: 'color-1', shape: 'cottage' }

describe('Chip variants', () => {
  it('defaults to data-size md', () => {
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid />)
    expect(screen.getByTestId('chip-color-1-cottage')).toHaveAttribute('data-size', 'md')
  })

  it('sets data-size lg', () => {
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid size="lg" />)
    expect(screen.getByTestId('chip-color-1-cottage')).toHaveAttribute('data-size', 'lg')
  })

  it('outline variant sets data-variant outline', () => {
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid variant="outline" />)
    expect(screen.getByTestId('chip-color-1-cottage')).toHaveAttribute('data-variant', 'outline')
  })
})
