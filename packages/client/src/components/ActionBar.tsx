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

  const exchangeStyle = {
    background: isGhost
      ? "transparent"
      : canExchange
        ? "var(--color-text-accent)"
        : "var(--color-surface-cell)",
    border: isGhost ? "1px solid var(--color-text-accent)" : "none",
    borderRadius: "var(--button-radius)",
    color: canExchange ? "var(--color-surface-bg)" : "var(--color-text-secondary)",
    cursor: canExchange ? "pointer" : "not-allowed",
    fontWeight: 700,
    minHeight,
    padding: "var(--space-xs) var(--space-md)",
  } as const;

  const discardStyle = {
    background: isGhost
      ? "transparent"
      : canDiscard
        ? "var(--color-surface-cell-hover)"
        : "var(--color-surface-cell)",
    border: isGhost ? "1px solid var(--color-text-secondary)" : "none",
    borderRadius: "var(--button-radius)",
    color: canDiscard ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    cursor: canDiscard ? "pointer" : "not-allowed",
    fontWeight: 700,
    minHeight,
    padding: "var(--space-xs) var(--space-md)",
  } as const;

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
