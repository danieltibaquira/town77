import type { Grid as GridType } from "@town77/shared-types";
import { cellEntranceTransition } from "../lib/motion";
import { useTheme } from "../lib/theme";
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
  const { theme } = useTheme();
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;
  const cellEntrance = cellEntranceTransition(theme.animationPreset);

  return (
    <div
      data-testid="grid"
      role="grid"
      data-density={density}
      style={{
        background: "var(--color-surface-grid)",
        backgroundImage: isNeo ? "none" : "var(--texture-noise), var(--surface-grid-grad)",
        backgroundBlendMode: isNeo ? "normal" : "overlay, normal",
        borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-lg)",
        border: isNeo
          ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isNeo
          ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
          : "var(--shadow-lg), inset 0 2px 8px rgba(0,0,0,0.2)",
        display: "grid",
        gap,
        gridTemplateColumns: `repeat(${cols}, var(--layout-cell))`,
        padding: "var(--space-md)",
      }}
    >
      {grid.map((row, r) =>
        row.map((chip, c) => {
          const staggerDelay = (r * cols + c) * theme.animationPreset.cellEntrance.stagger;
          return (
            <Cell
              key={`${r}-${c}`}
              row={r}
              col={c}
              chip={chip}
              isValid={validSet.has(`${r},${c}`)}
              density={density}
              staggerDelay={staggerDelay}
              {...(onCellClick ? { onClick: onCellClick } : {})}
            />
          );
        }),
      )}
    </div>
  );
}
