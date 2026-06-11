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
  staggerDelay?: number;
  onClick?: (row: number, col: number) => void;
}

export function Cell({
  row,
  col,
  chip,
  isValid,
  density = "comfortable",
  highlightStyle = "glow",
  staggerDelay = 0,
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
        ? "var(--cell-bg-valid-radial)"
        : "var(--cell-bg-empty)";

  const boxShadow =
    isValid && chip === null && highlightStyle === "glow"
      ? "var(--shadow-glow-valid)"
      : chip === null
        ? "var(--shadow-inner-sm)"
        : undefined;

  const pulseActive = isValid && chip === null && highlightStyle === "pulse";
  const pulseTransition = cellPulseTransition(theme.animationPreset);
  const isOccupied = chip !== null;
  const rippleAnim = isOccupied ? `placement-ripple ${theme.animationPreset.placementRipple.duration}s ease-out forwards` : undefined;
  const entranceAnim = `cell-entrance ${theme.animationPreset.cellEntrance.duration}s ease-out forwards`;
  const delay = staggerDelay ? `${staggerDelay}s` : undefined;

  return (
    <motion.div
      role="button"
      tabIndex={chip === null && onClick ? 0 : -1}
      data-testid={`cell-${row}-${col}`}
      data-valid={isValid}
      data-density={density}
      data-occupied={isOccupied}
      data-hover={chip === null && isValid ? "brightness-scale" : "none"}
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
        animation: rippleAnim || entranceAnim,
        animationDelay: delay,
        aspectRatio: "1",
        background,
        border: `1px solid ${isValid ? "rgba(5, 150, 105, 0.3)" : "rgba(255,255,255,0.04)"}`,
        borderRadius: "var(--radius-md)",
        boxShadow: isValid 
          ? "0 0 12px rgba(5, 150, 105, 0.15), inset 0 1px 2px rgba(255,255,255,0.05)" 
          : "inset 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
        cursor: isValid && chip === null && onClick ? "pointer" : "default",
        display: "flex",
        height: cellSize,
        justifyContent: "center",
        outline: "none",
        outlineOffset: "var(--focus-ring-offset)",
        padding: isCompact ? "2px" : "var(--space-xs)",
        width: cellSize,
      }}
      whileHover={chip === null && isValid ? { scale: 1.02 } : undefined}
    >
      {chip !== null ? <Chip chip={chip} isSelected={false} isValid={false} /> : null}
    </motion.div>
  );
}
