import { screen } from '@testing-library/react'
import type { Score } from '@town77/shared-types'
import { describe, expect, it } from 'vitest'
import { ScoreTable } from '../components/ScoreTable'
import { renderWithTheme } from './helpers'

const scores: Score[] = [
  { playerId: 'p1', name: 'Alice', placed: 10, remaining: 2, combined: 8 },
  { playerId: 'p2', name: 'Bob', placed: 8, remaining: 1, combined: 7 },
  { playerId: 'p3', name: 'Carol', placed: 6, remaining: 4, combined: 2 },
]

describe('ScoreTable', () => {
  it('renders all player names', () => {
    renderWithTheme(<ScoreTable scores={scores} />)
    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Bob')).toBeDefined()
    expect(screen.getByText('Carol')).toBeDefined()
  })

  it('renders placed, remaining, and combined for each player', () => {
    renderWithTheme(<ScoreTable scores={scores} />)
    expect(screen.getByTestId('score-placed-p1')).toHaveTextContent('10')
    expect(screen.getByTestId('score-remaining-p1')).toHaveTextContent('2')
    expect(screen.getByTestId('score-combined-p1')).toHaveTextContent('8')
  })

  it('marks the combined winner with data-winner', () => {
    renderWithTheme(<ScoreTable scores={scores} />)
    expect(screen.getByTestId('score-row-p1')).toHaveAttribute('data-winner', 'true')
    expect(screen.getByTestId('score-row-p2')).toHaveAttribute('data-winner', 'false')
  })

  it('handles ties (multiple winners)', () => {
    const tied: Score[] = [
      { playerId: 'p1', name: 'Alice', placed: 10, remaining: 2, combined: 8 },
      { playerId: 'p2', name: 'Bob', placed: 10, remaining: 2, combined: 8 },
    ]
    renderWithTheme(<ScoreTable scores={tied} />)
    expect(screen.getByTestId('score-row-p1')).toHaveAttribute('data-winner', 'true')
    expect(screen.getByTestId('score-row-p2')).toHaveAttribute('data-winner', 'true')
  })
})
