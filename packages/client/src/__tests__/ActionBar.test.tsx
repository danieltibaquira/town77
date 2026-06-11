import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionBar } from '../components/ActionBar'
import { renderWithTheme } from './helpers'

describe('ActionBar', () => {
  it('renders exchange and discard buttons', () => {
    renderWithTheme(
      <ActionBar canExchange={true} canDiscard={true} onExchange={() => {}} onDiscard={() => {}} />,
    )
    expect(screen.getByTestId('btn-exchange')).toBeInTheDocument()
    expect(screen.getByTestId('btn-discard')).toBeInTheDocument()
  })

  it('disables exchange button when canExchange=false', () => {
    renderWithTheme(
      <ActionBar
        canExchange={false}
        canDiscard={true}
        onExchange={() => {}}
        onDiscard={() => {}}
      />,
    )
    expect(screen.getByTestId('btn-exchange')).toBeDisabled()
  })

  it('disables discard button when canDiscard=false', () => {
    renderWithTheme(
      <ActionBar
        canExchange={true}
        canDiscard={false}
        onExchange={() => {}}
        onDiscard={() => {}}
      />,
    )
    expect(screen.getByTestId('btn-discard')).toBeDisabled()
  })

  it('calls onExchange when exchange button clicked', () => {
    const onExchange = vi.fn()
    renderWithTheme(
      <ActionBar
        canExchange={true}
        canDiscard={true}
        onExchange={onExchange}
        onDiscard={() => {}}
      />,
    )
    fireEvent.click(screen.getByTestId('btn-exchange'))
    expect(onExchange).toHaveBeenCalledTimes(1)
  })

  it('calls onDiscard when discard button clicked', () => {
    const onDiscard = vi.fn()
    renderWithTheme(
      <ActionBar
        canExchange={true}
        canDiscard={true}
        onExchange={() => {}}
        onDiscard={onDiscard}
      />,
    )
    fireEvent.click(screen.getByTestId('btn-discard'))
    expect(onDiscard).toHaveBeenCalledTimes(1)
  })
})
