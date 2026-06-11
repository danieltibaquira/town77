import { useTheme } from "../lib/theme";

interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

export function Stepper({ label, value, min, max, onChange }: StepperProps) {
  const { theme } = useTheme();
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;

  const buttonStyle = {
    background: 'var(--color-surface-cell)',
    border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : 'none',
    borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-sm)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    height: 36,
    width: 36,
    boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : undefined,
    transition: isNeo ? 'var(--neo-transition)' : undefined,
  }

  return (
    <div data-testid="stepper" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', minWidth: 80 }}>
        {label}
      </span>
      <button type="button" data-testid="stepper-dec" disabled={value <= min} onClick={() => onChange(value - 1)} style={{ ...buttonStyle, opacity: value <= min ? 0.4 : 1 }}>−</button>
      <span data-testid="stepper-value" style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-lg)', fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{value}</span>
      <button type="button" data-testid="stepper-inc" disabled={value >= max} onClick={() => onChange(value + 1)} style={{ ...buttonStyle, opacity: value >= max ? 0.4 : 1 }}>+</button>
    </div>
  )
}
