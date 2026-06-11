import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Toast } from '../components/Toast'
import { renderWithTheme } from './helpers'

describe('Toast', () => {
  it('renders message text', () => {
    renderWithTheme(<Toast message="Something went wrong" onDismiss={() => {}} />)
    expect(screen.getByText('Something went wrong')).toBeDefined()
  })

  it('calls onDismiss when close button clicked', async () => {
    const onDismiss = vi.fn()
    renderWithTheme(<Toast message="Error" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByTestId('toast-dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when message is null', () => {
    const { container } = renderWithTheme(<Toast message={null} onDismiss={() => {}} />)
    expect(container.querySelector('[data-testid="toast"]')).toBeNull()
  })
})
