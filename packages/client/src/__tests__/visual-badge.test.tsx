import { describe, expect, it } from 'vitest'
import { PlayerBadge } from '../components/PlayerBadge'
import { renderWithTheme } from './helpers'

describe('Visual Design: PlayerBadge Glow', () => {
  it('glows on active turn', () => {
    const { container } = renderWithTheme(
      <PlayerBadge
        player={{
          id: 'p1',
          name: 'Alice',
          hand: [],
          placed: 0,
          hasDiscarded: false,
          connected: true,
        }}
        isCurrentTurn={true}
        isMyPlayer={false}
      />,
    )
    const badge = container.querySelector('[data-testid="player-badge-p1"]')
    const style = badge?.getAttribute('style') || ''
    expect(style).toContain('box-shadow')
  })

  it('no glow when not active turn', () => {
    const { container } = renderWithTheme(
      <PlayerBadge
        player={{
          id: 'p1',
          name: 'Alice',
          hand: [],
          placed: 0,
          hasDiscarded: false,
          connected: true,
        }}
        isCurrentTurn={false}
        isMyPlayer={false}
      />,
    )
    const badge = container.querySelector('[data-testid="player-badge-p1"]')
    const style = badge?.getAttribute('style') || ''
    expect(style).not.toContain('box-shadow')
  })
})
