import type { Chip } from "@town77/shared-types";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Hand } from "../components/Hand";
import { renderWithTheme } from "./helpers";

describe("Hand", () => {
  const chips: Chip[] = [
    { color: "color-1", shape: "cottage" },
    { color: "color-2", shape: "tower" },
    { color: "color-3", shape: "barn" },
    { color: "color-4", shape: "victorian" },
  ];

  it("renders all chips in hand", () => {
    renderWithTheme(<Hand chips={chips} selectedChip={null} onSelect={() => {}} />);
    expect(screen.getByTestId("chip-color-1-cottage")).toBeInTheDocument();
    expect(screen.getByTestId("chip-color-4-victorian")).toBeInTheDocument();
  });

  it("marks selected chip with data-selected=true", () => {
    renderWithTheme(<Hand chips={chips} selectedChip={chips[0] ?? null} onSelect={() => {}} />);
    expect(screen.getByTestId("chip-color-1-cottage")).toHaveAttribute("data-selected", "true");
    expect(screen.getByTestId("chip-color-2-tower")).toHaveAttribute("data-selected", "false");
  });

  it("calls onSelect when chip is clicked", () => {
    const onSelect = vi.fn();
    renderWithTheme(<Hand chips={chips} selectedChip={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("chip-color-2-tower"));
    expect(onSelect).toHaveBeenCalledWith(chips[1]);
  });

  it("renders empty hand without crashing", () => {
    expect(() => renderWithTheme(<Hand chips={[]} selectedChip={null} onSelect={() => {}} />)).not.toThrow();
  });

  describe("Surface Depth", () => {
    it("applies felt texture background", () => {
      const { container } = renderWithTheme(<Hand chips={chips} selectedChip={null} onSelect={() => {}} />);
      const hand = container.querySelector('[data-testid="hand"]') as HTMLElement;
      expect(hand).not.toBeNull();
      const style = hand.getAttribute("style") || "";
      expect(style).toContain("var(--surface-felt-grad)");
    });

    it("applies inner shadow for depth", () => {
      const { container } = renderWithTheme(<Hand chips={chips} selectedChip={null} onSelect={() => {}} />);
      const hand = container.querySelector('[data-testid="hand"]') as HTMLElement;
      expect(hand).not.toBeNull();
      const style = hand.getAttribute("style") || "";
      expect(style).toContain("var(--shadow-inner-xs)");
    });
  });
});
