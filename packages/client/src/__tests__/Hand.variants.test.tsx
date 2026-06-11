import { screen } from '@testing-library/react'
import type { Chip } from '@town77/shared-types'
import { describe, expect, it } from 'vitest'
import { Hand } from '../components/Hand'
import { renderWithTheme } from './helpers'

const chips: Chip[] = [
  { color: 'color-1', shape: 'cottage' },
  { color: 'color-2', shape: 'tower' },
]

describe('Hand variants', () => {
  it('stacked mode enables flex-wrap', () => {
    renderWithTheme(
      <Hand chips={chips} selectedChip={null} onSelect={() => {}} layoutMode="stacked" />,
    )
    expect(screen.getByTestId('hand')).toHaveStyle({ flexWrap: 'wrap' })
  })

  it('scrolling mode is default layout', () => {
    renderWithTheme(<Hand chips={chips} selectedChip={null} onSelect={() => {}} />)
    expect(screen.getByTestId('hand')).toHaveAttribute('data-layout', 'scrolling')
  })
})
