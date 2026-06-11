import { useTranslation } from "react-i18next";

type ActionBarSize = "sm" | "md";
type ActionBarVariant = "raised" | "ghost";

interface ActionBarProps {
  canExchange: boolean;
  canDiscard: boolean;
  size?: ActionBarSize;
  variant?: ActionBarVariant;
  iconOnly?: boolean;
  onExchange: () => void;
  onDiscard: () => void;
}

export function ActionBar({
  canDiscard,
  canExchange,
  iconOnly = false,
  onDiscard,
  onExchange,
  size = "md",
  variant = "raised",
}: ActionBarProps) {
  const { t } = useTranslation("game");
  const minHeight = size === "sm" ? 32 : 48;
  const isGhost = variant === "ghost";

  const baseButtonStyle = {
    borderRadius: "var(--radius-md)",
    fontWeight: 700,
    minHeight: 48,
    padding: "var(--space-sm) var(--space-xl)",
    fontSize: "var(--text-base)",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    transition: "all 0.2s ease-out",
    boxShadow: "var(--shadow-sm)",
  };

  const exchangeStyle = {
    ...baseButtonStyle,
    background: canExchange
      ? "linear-gradient(180deg, #d4b76a 0%, #c4a35a 100%)"
      : "var(--color-surface-cell)",
    border: "none",
    color: canExchange ? "var(--color-surface-bg)" : "var(--color-text-secondary)",
    cursor: canExchange ? "pointer" : "not-allowed",
    boxShadow: canExchange ? "var(--shadow-md), 0 0 8px rgba(196, 163, 90, 0.3)" : "var(--shadow-sm)",
  };

  const discardStyle = {
    ...baseButtonStyle,
    background: canDiscard
      ? "linear-gradient(180deg, #3a3447 0%, #2e2847 100%)"
      : "var(--color-surface-cell)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: canDiscard ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    cursor: canDiscard ? "pointer" : "not-allowed",
  };

  return (
    <div
      data-testid="action-bar"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: "rgba(15, 13, 23, 0.65)",
        borderTop: "1px solid rgba(196, 163, 90, 0.2)",
        borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        display: "flex",
        gap: "var(--space-md)",
        justifyContent: "center",
        padding: "var(--space-md) var(--space-lg)",
        position: "sticky",
        bottom: 0,
        zIndex: 10,
      }}
    >
      <button
        type="button"
        data-testid="btn-exchange"
        data-size={size}
        data-variant={variant}
        disabled={!canExchange}
        onClick={onExchange}
        style={exchangeStyle}
      >
        {iconOnly ? "↔" : t("exchange")}
      </button>
      <button
        type="button"
        data-testid="btn-discard"
        data-size={size}
        data-variant={variant}
        disabled={!canDiscard}
        onClick={onDiscard}
        style={discardStyle}
      >
        {iconOnly ? "×" : t("discard")}
      </button>
    </div>
  );
}
