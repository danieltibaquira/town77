import type { Chip as ChipType } from "@town77/shared-types";
import { motion } from "framer-motion";
import { cellPulseTransition } from "../lib/motion";
import { useTheme } from "../lib/theme";
import { Chip } from "./Chip";

type CellDensity = "compact" | "comfortable";
type CellHighlight = "glow" | "pulse";

interface CellProps {
  row: number;
  col: number;
  chip: ChipType | null;
  isValid: boolean;
  density?: CellDensity;
  highlightStyle?: CellHighlight;
  onClick?: (row: number, col: number) => void;
}

export function Cell({
  row,
  col,
  chip,
  isValid,
  density = "comfortable",
  highlightStyle = "glow",
  onClick,
}: CellProps) {
  const { theme } = useTheme();
  const isCompact = density === "compact";
  const cellSize = isCompact ? "calc(var(--layout-cell) * 0.85)" : "var(--layout-cell)";

  function handleClick() {
    if (chip !== null || !onClick) return;
    onClick(row, col);
  }

  const background =
    chip !== null
      ? "var(--cell-bg-empty)"
      : isValid
        ? "var(--cell-bg-valid)"
        : "var(--cell-bg-empty)";

  const boxShadow =
    isValid && chip === null && highlightStyle === "glow"
      ? "0 0 0 2px var(--color-text-accent)"
      : undefined;

  const pulseActive = isValid && chip === null && highlightStyle === "pulse";
  const pulseTransition = cellPulseTransition(theme.animationPreset);

  return (
    <motion.div
      role="button"
      tabIndex={chip === null && onClick ? 0 : -1}
      data-testid={`cell-${row}-${col}`}
      data-valid={isValid}
      data-density={density}
      data-highlight={isValid && chip === null ? highlightStyle : "none"}
      {...(pulseActive
        ? {
            animate: { scale: [1, 1.04, 1] },
            transition: pulseTransition.transition ?? { duration: 0 },
          }
        : {})}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") handleClick();
      }}
      style={{
        alignItems: "center",
        aspectRatio: "1",
        background,
        border: `1px solid ${isValid ? "var(--cell-bg-hover)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "var(--cell-radius)",
        boxShadow,
        cursor: isValid && chip === null && onClick ? "pointer" : "default",
        display: "flex",
        height: cellSize,
        justifyContent: "center",
        padding: isCompact ? "2px" : "var(--space-xs)",
        width: cellSize,
      }}
    >
      {chip !== null ? <Chip chip={chip} isSelected={false} isValid={false} /> : null}
    </motion.div>
  );
}
