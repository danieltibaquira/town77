import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import type { PlayerState } from "@town77/shared-types";
import { PlayerBadge } from "../components/PlayerBadge";
import { renderWithTheme } from "./helpers";

const player: PlayerState = {
  id: "p1",
  name: "Alice",
  hand: [],
  placed: 3,
  hasDiscarded: false,
  connected: true,
};

describe("PlayerBadge", () => {
  it("marks active turn with data-active", () => {
    renderWithTheme(<PlayerBadge player={player} isCurrentTurn isMyPlayer />);
    expect(screen.getByTestId("player-badge-p1")).toHaveAttribute("data-active", "true");
  });

  it("compact variant hides placed count", () => {
    renderWithTheme(
      <PlayerBadge player={player} isCurrentTurn={false} isMyPlayer variant="compact" />,
    );
    expect(screen.getByTestId("player-badge-p1")).toHaveAttribute("data-variant", "compact");
    expect(screen.queryByLabelText("placed chips")).toBeNull();
  });

  describe("Surface Depth", () => {
    it("applies accent glow shadow when active turn", () => {
      renderWithTheme(<PlayerBadge player={player} isCurrentTurn isMyPlayer />);
      const badge = screen.getByTestId("player-badge-p1");
      const style = badge.getAttribute("style") || "";
      expect(style).toContain("var(--shadow-glow-accent)");
    });

    it("does not apply glow shadow when inactive", () => {
      renderWithTheme(<PlayerBadge player={player} isCurrentTurn={false} isMyPlayer />);
      const badge = screen.getByTestId("player-badge-p1");
      const style = badge.getAttribute("style") || "";
      expect(style).not.toContain("var(--shadow-glow-accent)");
    });
  });
});
