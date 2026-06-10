import type { Chip as ChipType } from "@town77/shared-types";
import { useTheme } from "../lib/theme";
import { Chip } from "./Chip";

interface CellProps {
  row: number;
  col: number;
  chip: ChipType | null;
  isValid: boolean;
  onClick?: (row: number, col: number) => void;
}

export function Cell({ row, col, chip, isValid, onClick }: CellProps) {
  const { theme } = useTheme();

  function handleClick() {
    if (chip !== null || !onClick) return;
    onClick(row, col);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`cell-${row}-${col}`}
      data-valid={isValid}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") handleClick();
      }}
      style={{
        alignItems: "center",
        aspectRatio: "1",
        background: isValid && chip === null ? theme.surfaces.cellValid : theme.surfaces.cell,
        border: `1px solid ${isValid ? theme.surfaces.cellHover : "rgba(255,255,255,0.08)"}`,
        borderRadius: "var(--radius-sm)",
        cursor: isValid && chip === null && onClick ? "pointer" : "default",
        display: "flex",
        height: "var(--layout-cell)",
        justifyContent: "center",
        padding: "var(--space-xs)",
        width: "var(--layout-cell)",
      }}
    >
      {chip !== null ? <Chip chip={chip} isSelected={false} isValid={false} /> : null}
    </div>
  );
}
