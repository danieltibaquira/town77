import { useTranslation } from "react-i18next";
import { useTheme } from "../lib/theme";

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
  const { theme } = useTheme();
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;
  const minHeight = size === "sm" ? 32 : 48;
  const isGhost = variant === "ghost";

  const baseButtonStyle = {
    borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-md)",
    fontWeight: 700,
    minHeight: 48,
    padding: "var(--space-sm) var(--space-xl)",
    fontSize: "var(--text-base)",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    transition: isNeo ? "var(--neo-transition)" : "all 0.2s ease-out",
    boxShadow: isNeo
      ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
      : "var(--shadow-sm)",
    border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : "none",
  };

  const exchangeStyle = {
    ...baseButtonStyle,
    background: canExchange
      ? isNeo
        ? "#ffe66d"
        : "linear-gradient(180deg, #d4b76a 0%, #c4a35a 100%)"
      : "var(--color-surface-cell)",
    color: canExchange
      ? isNeo
        ? "#000000"
        : "var(--color-surface-bg)"
      : "var(--color-text-secondary)",
    cursor: canExchange ? "pointer" : "not-allowed",
    boxShadow: canExchange
      ? isNeo
        ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
        : "var(--shadow-md), 0 0 8px rgba(196, 163, 90, 0.3)"
      : isNeo
        ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
        : "var(--shadow-sm)",
  };

  const discardStyle = {
    ...baseButtonStyle,
    background: canDiscard
      ? isNeo
        ? "#ffffff"
        : "linear-gradient(180deg, #3a3447 0%, #2e2847 100%)"
      : "var(--color-surface-cell)",
    color: canDiscard
      ? isNeo
        ? "#000000"
        : "var(--color-text-primary)"
      : "var(--color-text-secondary)",
    cursor: canDiscard ? "pointer" : "not-allowed",
  };

  return (
    <div
      data-testid="action-bar"
      style={{
        backdropFilter: isNeo ? "none" : "blur(16px)",
        WebkitBackdropFilter: isNeo ? "none" : "blur(16px)",
        background: isNeo ? theme.surfaces.background : "rgba(15, 13, 23, 0.65)",
        borderTop: isNeo
          ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
          : "1px solid rgba(196, 163, 90, 0.2)",
        borderRadius: isNeo ? `${neoRadius}px ${neoRadius}px 0 0` : "var(--radius-lg) var(--radius-lg) 0 0",
        boxShadow: isNeo
          ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
          : "0 -4px 24px rgba(0,0,0,0.4)",
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
