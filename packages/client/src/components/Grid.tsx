import type { Grid as GridType } from "@town77/shared-types";
import { Cell } from "./Cell";

type GridDensity = "compact" | "comfortable";

interface GridProps {
  grid: GridType;
  validCells: [number, number][];
  density?: GridDensity;
  onCellClick?: (row: number, col: number) => void;
}

export function Grid({ grid, validCells, density = "comfortable", onCellClick }: GridProps) {
  const validSet = new Set(validCells.map(([r, c]) => `${r},${c}`));
  const cols = grid[0]?.length ?? 7;
  const gap = density === "compact" ? "calc(var(--layout-gap) * 0.5)" : "var(--layout-gap)";

  return (
    <div
      data-testid="grid"
      data-density={density}
      style={{
        background: "var(--color-surface-grid)",
        borderRadius: "var(--radius-md)",
        display: "grid",
        gap,
        gridTemplateColumns: `repeat(${cols}, var(--layout-cell))`,
        padding: "var(--space-sm)",
      }}
    >
      {grid.map((row, r) =>
        row.map((chip, c) => (
          <Cell
            key={`${r}-${c}`}
            row={r}
            col={c}
            chip={chip}
            isValid={validSet.has(`${r},${c}`)}
            density={density}
            {...(onCellClick ? { onClick: onCellClick } : {})}
          />
        )),
      )}
    </div>
  );
}
