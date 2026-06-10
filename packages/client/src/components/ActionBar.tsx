interface ActionBarProps {
  canExchange: boolean;
  canDiscard: boolean;
  onExchange: () => void;
  onDiscard: () => void;
}

const baseButtonStyle = {
  borderRadius: "var(--radius-md)",
  fontWeight: 700,
  minHeight: 40,
  padding: "var(--space-xs) var(--space-md)",
} as const;

export function ActionBar({ canDiscard, canExchange, onDiscard, onExchange }: ActionBarProps) {
  return (
    <div
      data-testid="action-bar"
      style={{
        display: "flex",
        gap: "var(--space-sm)",
        padding: "var(--space-sm)",
      }}
    >
      <button
        type="button"
        data-testid="btn-exchange"
        disabled={!canExchange}
        onClick={onExchange}
        style={{
          ...baseButtonStyle,
          background: canExchange ? "var(--color-text-accent)" : "var(--color-surface-cell)",
          color: canExchange ? "#111111" : "var(--color-text-secondary)",
          cursor: canExchange ? "pointer" : "not-allowed",
        }}
      >
        Intercambiar
      </button>
      <button
        type="button"
        data-testid="btn-discard"
        disabled={!canDiscard}
        onClick={onDiscard}
        style={{
          ...baseButtonStyle,
          background: canDiscard ? "var(--color-surface-cell-hover)" : "var(--color-surface-cell)",
          color: canDiscard ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          cursor: canDiscard ? "pointer" : "not-allowed",
        }}
      >
        Descartar
      </button>
    </div>
  );
}
