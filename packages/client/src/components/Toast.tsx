import { errorShakeTransition } from '../lib/motion'
import { useTheme } from '../lib/theme'

interface ToastProps {
  message: string | null
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null
  const { theme } = useTheme()
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;
  const shake = errorShakeTransition(theme.animationPreset)

  return (
    <div
      role="alert"
      data-testid="toast"
      style={{
        alignItems: 'center',
        animation: shake.animation,
        background: isNeo ? 'var(--neo-accent)' : 'var(--cell-bg-invalid)',
        borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-md)',
        bottom: 'var(--space-lg)',
        color: isNeo ? '#000000' : 'var(--color-text-primary)',
        display: 'flex',
        gap: 'var(--space-sm)',
        left: '50%',
        maxWidth: 400,
        padding: 'var(--space-sm) var(--space-md)',
        position: 'fixed',
        transform: 'translateX(-50%)',
        zIndex: 100,
        border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : undefined,
        boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : undefined,
      }}
    >
      <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{message}</span>
      <button
        type="button"
        data-testid="toast-dismiss"
        onClick={onDismiss}
        style={{ background: 'transparent', border: 'none', color: isNeo ? '#000000' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-lg)' }}
      >
        ×
      </button>
    </div>
  )
}
