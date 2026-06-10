import type { Chip as ChipType } from "@town77/shared-types";
import { useTheme } from "../lib/theme";

interface ChipProps {
  chip: ChipType;
  isSelected: boolean;
  isValid: boolean;
  onClick?: () => void;
}

export function Chip({ chip, isSelected, isValid, onClick }: ChipProps) {
  const { theme } = useTheme();
  const svgPath = theme.shapes[chip.shape] ?? "M5 35 L20 5 L35 35 Z";
  const fill = theme.colorPalette[chip.color] ?? "#888888";

  return (
    <button
      type="button"
      aria-label={`${chip.color} ${chip.shape}`}
      data-testid={`chip-${chip.color}-${chip.shape}`}
      data-selected={isSelected}
      data-valid={isValid}
      onClick={onClick}
      style={{
        alignItems: "center",
        background: "transparent",
        borderRadius: "var(--radius-sm)",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        opacity: isValid ? 1 : 0.55,
        outline: isSelected ? "2px solid var(--color-text-accent)" : "0",
        padding: 4,
        width: "100%",
      }}
    >
      <svg aria-hidden="true" height="100%" viewBox="0 0 40 40" width="100%">
        <path d={svgPath} fill={fill} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      </svg>
    </button>
  );
}
