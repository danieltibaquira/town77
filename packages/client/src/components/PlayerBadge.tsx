import type { PlayerState } from "@town77/shared-types";

interface PlayerBadgeProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  isMyPlayer: boolean;
}

export function PlayerBadge({ player, isCurrentTurn, isMyPlayer }: PlayerBadgeProps) {
  return (
    <div
      data-testid={`player-badge-${player.id}`}
      data-active={isCurrentTurn}
      style={{
        alignItems: "center",
        background: isCurrentTurn ? "var(--color-text-accent)" : "var(--color-surface-cell)",
        borderRadius: "var(--radius-pill)",
        color: isCurrentTurn ? "#111111" : "var(--color-text-primary)",
        display: "flex",
        fontSize: "var(--text-sm)",
        fontWeight: isMyPlayer ? 700 : 500,
        gap: "var(--space-xs)",
        minHeight: 32,
        padding: "var(--space-xs) var(--space-sm)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          background: player.connected ? "#4CAF50" : "#9E9E9E",
          borderRadius: "50%",
          flex: "0 0 8px",
          height: 8,
          width: 8,
        }}
      />
      <span>{player.name}</span>
      <span aria-label="placed chips" style={{ opacity: 0.75 }}>
        {player.placed}
      </span>
    </div>
  );
}
