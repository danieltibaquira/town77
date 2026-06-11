import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Stepper } from '../components/Stepper'
import { renderWithTheme } from './helpers'

describe('Stepper', () => {
  it('displays current value', () => {
    renderWithTheme(<Stepper label="Colors" value={5} min={1} max={7} onChange={() => {}} />)
    expect(screen.getByTestId('stepper-value')).toHaveTextContent('5')
  })

  it('displays label', () => {
    renderWithTheme(<Stepper label="Colors" value={5} min={1} max={7} onChange={() => {}} />)
    expect(screen.getByText('Colors')).toBeDefined()
  })

  it('calls onChange with value+1 on increment click', async () => {
    const onChange = vi.fn()
    renderWithTheme(<Stepper label="Colors" value={5} min={1} max={7} onChange={onChange} />)
    await userEvent.click(screen.getByTestId('stepper-inc'))
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it('calls onChange with value-1 on decrement click', async () => {
    const onChange = vi.fn()
    renderWithTheme(<Stepper label="Colors" value={5} min={1} max={7} onChange={onChange} />)
    await userEvent.click(screen.getByTestId('stepper-dec'))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('disables decrement at min', () => {
    renderWithTheme(<Stepper label="Colors" value={1} min={1} max={7} onChange={() => {}} />)
    expect(screen.getByTestId('stepper-dec')).toBeDisabled()
  })

  it('disables increment at max', () => {
    renderWithTheme(<Stepper label="Colors" value={7} min={1} max={7} onChange={() => {}} />)
    expect(screen.getByTestId('stepper-inc')).toBeDisabled()
  })
})
