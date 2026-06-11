import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Cell } from '../components/Cell'
import { renderWithTheme } from './helpers'

describe('Cell variants', () => {
  it('compact density sets data-density compact', () => {
    renderWithTheme(<Cell row={0} col={0} chip={null} isValid density="compact" />)
    expect(screen.getByTestId('cell-0-0')).toHaveAttribute('data-density', 'compact')
  })

  it('pulse highlight sets data-highlight pulse when valid', () => {
    renderWithTheme(<Cell row={0} col={0} chip={null} isValid highlightStyle="pulse" />)
    expect(screen.getByTestId('cell-0-0')).toHaveAttribute('data-highlight', 'pulse')
  })
})
