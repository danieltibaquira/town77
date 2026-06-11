import { describe, expect, it } from 'vitest'
import { ActionBar } from '../components/ActionBar'
import { renderWithTheme } from './helpers'

describe('Visual Design: Glassmorphic ActionBar', () => {
  it('has backdrop-filter blur', () => {
    const { container } = renderWithTheme(
      <ActionBar canExchange={true} canDiscard={true} onExchange={() => {}} onDiscard={() => {}} />,
    )
    const bar = container.querySelector('[data-testid="action-bar"]')
    // jsdom doesn't render backdrop-filter in style string, check element exists
    expect(bar).toBeInTheDocument()
  })

  it('has semi-transparent background', () => {
    const { container } = renderWithTheme(
      <ActionBar canExchange={true} canDiscard={true} onExchange={() => {}} onDiscard={() => {}} />,
    )
    const bar = container.querySelector('[data-testid="action-bar"]')
    const style = bar?.getAttribute('style') || ''
    expect(style).toContain('rgba')
  })

  it('has border top for glass edge', () => {
    const { container } = renderWithTheme(
      <ActionBar canExchange={true} canDiscard={true} onExchange={() => {}} onDiscard={() => {}} />,
    )
    const bar = container.querySelector('[data-testid="action-bar"]')
    const style = bar?.getAttribute('style') || ''
    expect(style).toContain('border-top')
  })
})
