import { createGrid } from "@town77/game-engine";
import type { Grid as GridType } from "@town77/shared-types";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Grid } from "../components/Grid";
import { renderWithTheme } from "./helpers";

describe("Grid", () => {
  const emptyGrid: GridType = createGrid(7, 7);

  it("renders 49 cells for a 7x7 grid", () => {
    renderWithTheme(<Grid grid={emptyGrid} validCells={[]} onCellClick={() => {}} />);
    expect(screen.getAllByTestId(/^cell-\d+-\d+$/)).toHaveLength(49);
  });

  it("renders corner cells cell-0-0 and cell-6-6", () => {
    renderWithTheme(<Grid grid={emptyGrid} validCells={[]} onCellClick={() => {}} />);
    expect(screen.getByTestId("cell-0-0")).toBeInTheDocument();
    expect(screen.getByTestId("cell-6-6")).toBeInTheDocument();
  });

  it("marks valid cells with data-valid=true", () => {
    renderWithTheme(
      <Grid
        grid={emptyGrid}
        validCells={[
          [0, 0],
          [3, 4],
        ]}
        onCellClick={() => {}}
      />,
    );
    expect(screen.getByTestId("cell-0-0")).toHaveAttribute("data-valid", "true");
    expect(screen.getByTestId("cell-3-4")).toHaveAttribute("data-valid", "true");
    expect(screen.getByTestId("cell-1-1")).toHaveAttribute("data-valid", "false");
  });

  it("renders chip in occupied cell", () => {
    const grid = emptyGrid.map((row) => [...row]) as GridType;
    grid[2]![3] = { color: "color-1", shape: "cottage" };
    renderWithTheme(<Grid grid={grid} validCells={[]} onCellClick={() => {}} />);
    expect(screen.getByTestId("chip-color-1-cottage")).toBeInTheDocument();
  });

  it("calls onCellClick when valid empty cell clicked", () => {
    const onCellClick = vi.fn();
    renderWithTheme(<Grid grid={emptyGrid} validCells={[[2, 3]]} onCellClick={onCellClick} />);
    fireEvent.click(screen.getByTestId("cell-2-3"));
    expect(onCellClick).toHaveBeenCalledWith(2, 3);
  });

  describe("Surface Depth", () => {
    it("applies wood grain texture background", () => {
      const { container } = renderWithTheme(<Grid grid={emptyGrid} validCells={[]} onCellClick={() => {}} />);
      const grid = container.querySelector('[data-testid="grid"]') as HTMLElement;
      expect(grid).not.toBeNull();
      const style = grid.getAttribute("style") || "";
      expect(style).toContain("var(--texture-wood)");
    });

    it("applies gradient overlay for ambient lighting", () => {
      const { container } = renderWithTheme(<Grid grid={emptyGrid} validCells={[]} onCellClick={() => {}} />);
      const grid = container.querySelector('[data-testid="grid"]') as HTMLElement;
      expect(grid).not.toBeNull();
      const style = grid.getAttribute("style") || "";
      expect(style).toContain("var(--surface-grid-grad)");
    });

    it("applies shadow-md elevation", () => {
      const { container } = renderWithTheme(<Grid grid={emptyGrid} validCells={[]} onCellClick={() => {}} />);
      const grid = container.querySelector('[data-testid="grid"]') as HTMLElement;
      expect(grid).not.toBeNull();
      const style = grid.getAttribute("style") || "";
      expect(style).toContain("var(--shadow-md)");
    });
  });
});
