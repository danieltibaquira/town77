import type { Theme } from '@town77/shared-types'

interface ThemeCardProps {
  theme: Theme
  isSelected: boolean
  onClick: () => void
}

export function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  const colors = Object.values(theme.colorPalette)
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;

  return (
    <button
      type="button"
      data-testid={`theme-card-${theme.id}`}
      data-selected={isSelected}
      onClick={onClick}
      style={{
        background: theme.surfaces.background,
        border: isSelected
          ? '2px solid var(--color-text-accent)'
          : isNeo
            ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
            : '2px solid transparent',
        borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-md)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
        padding: 'var(--space-sm)',
        textAlign: 'left' as const,
        boxShadow: isNeo && isSelected
          ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
          : undefined,
      }}
    >
      <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
        {theme.name}
      </span>
      <div style={{ display: 'flex', gap: 2 }}>
        {colors.map((color, i) => (
          <div key={i} data-testid={`theme-swatch-${i}`} style={{ background: color, borderRadius: 'var(--radius-sm)', flex: 1, height: 20 }} />
        ))}
      </div>
    </button>
  )
}
