import { errorShakeTransition } from '../lib/motion'
import { useTheme } from '../lib/theme'

interface ToastProps {
  message: string | null
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null
  const { theme } = useTheme()
  const shake = errorShakeTransition(theme.animationPreset)

  return (
    <div
      role="alert"
      data-testid="toast"
      style={{
        alignItems: 'center',
        animation: shake.animation,
        background: 'var(--cell-bg-invalid)',
        borderRadius: 'var(--radius-md)',
        bottom: 'var(--space-lg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        gap: 'var(--space-sm)',
        left: '50%',
        maxWidth: 400,
        padding: 'var(--space-sm) var(--space-md)',
        position: 'fixed',
        transform: 'translateX(-50%)',
        zIndex: 100,
      }}
    >
      <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{message}</span>
      <button
        type="button"
        data-testid="toast-dismiss"
        onClick={onDismiss}
        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-lg)' }}
      >
        ×
      </button>
    </div>
  )
}
