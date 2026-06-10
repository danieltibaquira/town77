import type { Grid as GridType } from "@town77/shared-types";
import { useMemo } from "react";
import { useTheme } from "../lib/theme";
import { Cell } from "./Cell";

interface GridProps {
  grid: GridType;
  validCells: [number, number][];
  onCellClick?: (row: number, col: number) => void;
}

export function Grid({ grid, validCells, onCellClick }: GridProps) {
  const { theme } = useTheme();
  const validSet = useMemo(() => new Set(validCells.map(([row, col]) => `${row},${col}`)), [validCells]);
  const cols = grid[0]?.length ?? 0;

  return (
    <div
      data-testid="grid"
      style={{
        background: theme.surfaces.grid,
        borderRadius: "var(--radius-md)",
        display: "grid",
        gap: "var(--layout-gap)",
        gridTemplateColumns: `repeat(${cols}, var(--layout-cell))`,
        padding: "var(--space-sm)",
        width: "fit-content",
      }}
    >
      {grid.map((row, rowIndex) =>
        row.map((chip, colIndex) => {
          const cellProps = {
            row: rowIndex,
            col: colIndex,
            chip,
            isValid: validSet.has(`${rowIndex},${colIndex}`),
            ...(onCellClick ? { onClick: onCellClick } : {}),
          };

          return <Cell key={`${rowIndex}-${colIndex}`} {...cellProps} />;
        }),
      )}
    </div>
  );
}
