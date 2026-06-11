import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Chip } from '../components/Chip'
import { renderWithTheme } from './helpers'

describe('Chip', () => {
  const chip = { color: 'color-1', shape: 'cottage' }

  it('renders with data-testid', () => {
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />)
    expect(screen.getByTestId('chip-color-1-cottage')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />)
    expect(screen.getByTestId('chip-color-1-cottage').querySelector('svg')).not.toBeNull()
  })

  it('sets data-selected=true when isSelected', () => {
    renderWithTheme(<Chip chip={chip} isSelected={true} isValid={true} />)
    expect(screen.getByTestId('chip-color-1-cottage')).toHaveAttribute('data-selected', 'true')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} onClick={onClick} />)
    fireEvent.click(screen.getByTestId('chip-color-1-cottage'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders without throwing for unknown color', () => {
    expect(() =>
      renderWithTheme(
        <Chip chip={{ color: 'color-99', shape: 'cottage' }} isSelected={false} isValid={true} />,
      ),
    ).not.toThrow()
  })

  describe('4-Layer Rendering', () => {
    it('uses gradient fill from ChipDefs (url reference)', () => {
      renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />)
      const svg = screen.getByTestId('chip-color-1-cottage').querySelector('svg')
      expect(svg).not.toBeNull()
      const rects = svg?.querySelectorAll('rect')
      expect(rects?.length).toBeGreaterThan(0)
      // At least one rect should use gradient fill
      const hasGradientFill = Array.from(rects || []).some((r) =>
        r.getAttribute('fill')?.startsWith('url(#chip-grad-'),
      )
      expect(hasGradientFill).toBe(true)
    })

    it('applies shadow filter to chip base', () => {
      renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />)
      const svg = screen.getByTestId('chip-color-1-cottage').querySelector('svg')
      expect(svg).not.toBeNull()
      const shadowRect = svg?.querySelector('rect[filter]')
      expect(shadowRect).not.toBeNull()
      expect(shadowRect?.getAttribute('filter')).toBe('url(#chip-shadow)')
    })

    it('renders shape silhouette as SVG path', () => {
      renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />)
      const svg = screen.getByTestId('chip-color-1-cottage').querySelector('svg')
      expect(svg).not.toBeNull()
      const path = svg?.querySelector('path')
      expect(path).not.toBeNull()
      expect(path?.getAttribute('d')).toBeTruthy()
    })

    it('renders specular highlight as ellipse', () => {
      renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />)
      const svg = screen.getByTestId('chip-color-1-cottage').querySelector('svg')
      expect(svg).not.toBeNull()
      const ellipse = svg?.querySelector('ellipse')
      expect(ellipse).not.toBeNull()
      expect(ellipse?.getAttribute('fill')).toBe('url(#chip-sheen)')
    })
  })

  describe('Selection State', () => {
    it('applies glow shadow when selected', () => {
      renderWithTheme(<Chip chip={chip} isSelected={true} isValid={true} />)
      const button = screen.getByTestId('chip-color-1-cottage')
      const style = button.getAttribute('style') || ''
      expect(style).toContain('box-shadow')
      expect(style).toContain('var(--color-text-accent)')
    })

    it('sets data-selected=true when selected', () => {
      renderWithTheme(<Chip chip={chip} isSelected={true} isValid={true} />)
      expect(screen.getByTestId('chip-color-1-cottage')).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('Invalid State', () => {
    it('applies red vignette overlay when invalid', () => {
      renderWithTheme(<Chip chip={chip} isSelected={false} isValid={false} />)
      const svg = screen.getByTestId('chip-color-1-cottage').querySelector('svg')
      expect(svg).not.toBeNull()
      // Red vignette is a rect with red fill and opacity
      const vignette = svg?.querySelector("rect[fill*='rgba(180, 40, 40']")
      expect(vignette).not.toBeNull()
    })
  })

  describe('Gradient Integration', () => {
    it('uses gradient fill for each chip color', () => {
      const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7']
      colors.forEach((color) => {
        const { container, unmount } = renderWithTheme(
          <Chip chip={{ color, shape: 'cottage' }} isSelected={false} isValid={true} />,
        )
        const svg = container.querySelector('svg')
        expect(svg).not.toBeNull()
        const rects = svg?.querySelectorAll('rect')
        const hasGradientFill = Array.from(rects || []).some((r) =>
          r.getAttribute('fill')?.startsWith('url(#chip-grad-'),
        )
        expect(hasGradientFill).toBe(true)
        unmount()
      })
    })
  })
})
