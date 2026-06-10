import type { PlayerState } from "@town77/shared-types";

type PlayerBadgeSize = "sm" | "md";
type PlayerBadgeVariant = "default" | "compact";

interface PlayerBadgeProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  isMyPlayer: boolean;
  size?: PlayerBadgeSize;
  variant?: PlayerBadgeVariant;
}

export function PlayerBadge({
  player,
  isCurrentTurn,
  isMyPlayer,
  size = "md",
  variant = "default",
}: PlayerBadgeProps) {
  const isCompact = variant === "compact";
  const minHeight = size === "sm" ? 24 : isCompact ? 28 : 32;

  return (
    <div
      data-testid={`player-badge-${player.id}`}
      data-active={isCurrentTurn}
      data-size={size}
      data-variant={variant}
      style={{
        alignItems: "center",
        background: isCurrentTurn ? "var(--color-text-accent)" : "var(--color-surface-cell)",
        borderRadius: "var(--radius-pill)",
        color: isCurrentTurn ? "var(--color-surface-bg)" : "var(--color-text-primary)",
        display: "flex",
        fontSize: size === "sm" ? "var(--text-sm)" : "var(--text-base)",
        fontWeight: isMyPlayer ? 700 : 500,
        gap: isCompact ? "2px" : "var(--space-xs)",
        minHeight,
        padding: isCompact ? "2px var(--space-xs)" : "var(--space-xs) var(--space-sm)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          background: player.connected ? "var(--color-surface-cell-valid)" : "var(--color-text-secondary)",
          borderRadius: "50%",
          flex: "0 0 8px",
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
  );
}
