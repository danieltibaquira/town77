import type { PlayerState } from '@town77/shared-types'
import { badgeGlowPulseTransition } from '../lib/motion'
import { useTheme } from '../lib/theme'

type PlayerBadgeSize = 'sm' | 'md'
type PlayerBadgeVariant = 'default' | 'compact'

interface PlayerBadgeProps {
  player: PlayerState
  isCurrentTurn: boolean
  isMyPlayer: boolean
  size?: PlayerBadgeSize
  variant?: PlayerBadgeVariant
}

export function PlayerBadge({
  player,
  isCurrentTurn,
  isMyPlayer,
  size = 'md',
  variant = 'default',
}: PlayerBadgeProps) {
  const isCompact = variant === 'compact'
  const minHeight = size === 'sm' ? 24 : isCompact ? 28 : 32
  const { theme } = useTheme()
  const glowPulse = isCurrentTurn ? badgeGlowPulseTransition(theme.animationPreset) : {}
  const isNeo = theme.style === 'neobrutalism'
  const neoRadius = theme.styleProps.borderRadius

  return (
    <div
      data-testid={`player-badge-${player.id}`}
      data-active={isCurrentTurn}
      data-size={size}
      data-variant={variant}
      style={{
        alignItems: 'center',
        background: isCurrentTurn
          ? isNeo
            ? '#ffe66d'
            : 'linear-gradient(135deg, #d4b76a 0%, #c4a35a 100%)'
          : 'var(--color-surface-cell)',
        borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-pill)',
        border: isNeo
          ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
          : isCurrentTurn
            ? '2px solid rgba(196, 163, 90, 0.5)'
            : '2px solid rgba(255,255,255,0.08)',
        boxShadow: isNeo
          ? isCurrentTurn
            ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
            : 'none'
          : isCurrentTurn
            ? 'var(--shadow-glow-accent), 0 0 12px rgba(196, 163, 90, 0.2)'
            : 'var(--shadow-xs)',
        color: isCurrentTurn
          ? isNeo
            ? '#000000'
            : 'var(--color-surface-bg)'
          : 'var(--color-text-primary)',
        display: 'flex',
        fontSize: size === 'sm' ? 'var(--text-sm)' : 'var(--text-base)',
        fontWeight: isMyPlayer ? 700 : 500,
        gap: isCompact ? '2px' : 'var(--space-xs)',
        minHeight,
        padding: isCompact ? '2px var(--space-xs)' : 'var(--space-xs) var(--space-sm)',
        ...glowPulse,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          background: player.connected
            ? 'var(--color-surface-cell-valid)'
            : 'var(--color-text-secondary)',
          borderRadius: isNeo ? '0' : '50%',
          flex: '0 0 8px',
          height: 8,
          width: 8,
        }}
      />
      <span>{player.name}</span>
      {!isCompact ? (
        <span aria-label="placed chips" style={{ opacity: 0.75 }}>
          {player.placed}
        </span>
      ) : null}
    </div>
  )
}
