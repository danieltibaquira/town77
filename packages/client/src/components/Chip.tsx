import type { Chip as ChipType } from "@town77/shared-types";
import { motion } from "framer-motion";
import { chipPlaceTransition } from "../lib/motion";
import { useTheme } from "../lib/theme";

type ChipSize = "sm" | "md" | "lg";
type ChipVariant = "flat" | "outline";

interface ChipProps {
  chip: ChipType;
  isSelected: boolean;
  isValid: boolean;
  size?: ChipSize;
  variant?: ChipVariant;
  onClick?: () => void;
}

const SIZE_SCALE: Record<ChipSize, string> = {
  sm: "0.6",
  md: "1",
  lg: "1.4",
};

export function Chip({
  chip,
  isSelected,
  isValid,
  onClick,
  size = "md",
  variant = "flat",
}: ChipProps) {
  const { theme } = useTheme();
  const svgPath = theme.shapes[chip.shape] ?? "M5 35 L20 5 L35 35 Z";
  const fill = theme.colorPalette[chip.color] ?? "var(--color-text-secondary)";
  const scale = SIZE_SCALE[size];

  return (
    <motion.button
      type="button"
      layout
      aria-label={`${chip.color} ${chip.shape}`}
      data-testid={`chip-${chip.color}-${chip.shape}`}
      data-selected={isSelected}
      data-valid={isValid}
      data-size={size}
      data-variant={variant}
      onClick={onClick}
      transition={chipPlaceTransition(theme.animationPreset)}
      style={{
        alignItems: "center",
        background: "transparent",
        borderRadius: "var(--radius-sm)",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        height: `calc(var(--chip-size) * ${scale})`,
        justifyContent: "center",
        opacity: isValid ? 1 : 0.55,
        outline: isSelected ? "2px solid var(--color-text-accent)" : "0",
        padding: 4,
        width: `calc(var(--chip-size) * ${scale})`,
      }}
    >
      <svg aria-hidden="true" height="100%" viewBox="0 0 40 40" width="100%">
        <path
          d={svgPath}
          fill={variant === "outline" ? "none" : fill}
          stroke={variant === "outline" ? fill : "rgba(255,255,255,0.4)"}
          strokeWidth={variant === "outline" ? "var(--chip-stroke)" : "1.5"}
        />
      </svg>
    </motion.button>
  );
}
