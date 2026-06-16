import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Cell } from "../components/Cell";
import { renderWithTheme } from "./helpers";

describe("Cell", () => {
  it("renders with data-testid", () => {
    renderWithTheme(<Cell row={0} col={0} chip={null} isValid={false} />);
    expect(screen.getByTestId("cell-0-0")).toBeInTheDocument();
  });

  it("renders chip when occupied", () => {
    renderWithTheme(<Cell row={3} col={4} chip={{ color: "color-2", shape: "tower" }} isValid={false} />);
    expect(screen.getByTestId("chip-color-2-tower")).toBeInTheDocument();
  });

  it("sets data-valid=true when isValid", () => {
    renderWithTheme(<Cell row={1} col={1} chip={null} isValid={true} />);
    expect(screen.getByTestId("cell-1-1")).toHaveAttribute("data-valid", "true");
  });

  it("exposes a non-empty accessible name with the 1-based cell position", () => {
    renderWithTheme(<Cell row={2} col={3} chip={null} isValid={true} />);
    const label = screen.getByTestId("cell-2-3").getAttribute("aria-label") ?? "";
    // Language-agnostic: must be non-empty and reference the 1-based position
    expect(label).not.toBe("");
    expect(label).toMatch(/3/);
    expect(label).toMatch(/4/);
  });

  it("exposes an accessible name for an occupied cell", () => {
    renderWithTheme(
      <Cell row={0} col={0} chip={{ color: "color-1", shape: "barn" }} isValid={false} />,
    );
    const label = screen.getByTestId("cell-0-0").getAttribute("aria-label") ?? "";
    expect(label).not.toBe("");
    expect(label).toMatch(/1/);
  });

  it("calls onClick with row and col on empty valid cell", () => {
    const onClick = vi.fn();
    renderWithTheme(<Cell row={2} col={3} chip={null} isValid={true} onClick={onClick} />);
    fireEvent.click(screen.getByTestId("cell-2-3"));
    expect(onClick).toHaveBeenCalledWith(2, 3);
  });

  it("does not call onClick on occupied cell", () => {
    const onClick = vi.fn();
    renderWithTheme(
      <Cell row={0} col={0} chip={{ color: "color-1", shape: "barn" }} isValid={false} onClick={onClick} />,
    );
    fireEvent.click(screen.getByTestId("cell-0-0"));
    expect(onClick).not.toHaveBeenCalled();
  });

  describe("Surface Depth", () => {
    it("applies inner shadow to empty cells", () => {
      renderWithTheme(<Cell row={1} col={1} chip={null} isValid={false} />);
      const cell = screen.getByTestId("cell-1-1");
      const style = cell.getAttribute("style") || "";
      expect(style).toContain("var(--shadow-inner-sm)");
    });

    it("does not apply inner shadow to occupied cells", () => {
      renderWithTheme(<Cell row={1} col={1} chip={{ color: "color-1", shape: "barn" }} isValid={false} />);
      const cell = screen.getByTestId("cell-1-1");
      const style = cell.getAttribute("style") || "";
      expect(style).not.toContain("var(--shadow-inner-sm)");
    });

    it("applies glow shadow to valid empty cells", () => {
      renderWithTheme(<Cell row={1} col={1} chip={null} isValid={true} />);
      const cell = screen.getByTestId("cell-1-1");
      const style = cell.getAttribute("style") || "";
      expect(style).toContain("var(--shadow-glow-valid)");
    });
  });

  describe("Placement Ripple", () => {
    it("applies placement-ripple animation when occupied", () => {
      renderWithTheme(<Cell row={0} col={0} chip={{ color: "color-1", shape: "cottage" }} isValid={false} />);
      const cell = screen.getByTestId("cell-0-0");
      const style = cell.getAttribute("style") || "";
      expect(style).toContain("placement-ripple");
    });

    it("does not apply ripple animation when empty", () => {
      renderWithTheme(<Cell row={0} col={0} chip={null} isValid={false} />);
      const cell = screen.getByTestId("cell-0-0");
      const style = cell.getAttribute("style") || "";
      expect(style).not.toContain("placement-ripple");
    });

    it("sets data-occupied=true when chip is present", () => {
      renderWithTheme(<Cell row={0} col={0} chip={{ color: "color-1", shape: "cottage" }} isValid={false} />);
      expect(screen.getByTestId("cell-0-0")).toHaveAttribute("data-occupied", "true");
    });
  });
});
