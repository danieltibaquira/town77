import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../App'

describe('App', () => {
  it('renders the home screen at root', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByTestId('home-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Town 77' })).toBeInTheDocument()
  })

  it('navigates to config when create room is clicked', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    fireEvent.click(screen.getByTestId('btn-create'))
    expect(screen.getByTestId('config-screen')).toBeInTheDocument()
  })
})
