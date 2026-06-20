import type { Chip as ChipType } from "@town77/shared-types";
import { motion } from "framer-motion";
import { chipDrawInTransition, hoverLiftTransition } from "../lib/motion";
import { useTheme } from "../lib/theme";

type ChipSize = "sm" | "md" | "lg";
type ChipVariant = "flat" | "outline";

interface ChipProps {
  chip: ChipType;
  isSelected: boolean;
  isValid: boolean;
  size?: ChipSize;
  variant?: ChipVariant;
  /** Fill the parent box (used for placed chips so they match the cell). */
  fill?: boolean;
  staggerIndex?: number;
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
  fill = false,
  staggerIndex = 0,
}: ChipProps) {
  const { theme } = useTheme();
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;
  const svgPath = theme.shapes[chip.shape] ?? "M5 35 L20 5 L35 35 Z";
  const colorIndex = Object.keys(theme.colorPalette).indexOf(chip.color) + 1
  const chipColor = theme.colorPalette[chip.color];
  const scale = SIZE_SCALE[size];
  const dim = fill ? "100%" : `calc(var(--chip-size) * ${scale})`;
  const drawIn = chipDrawInTransition(theme.animationPreset, staggerIndex);
  const targetScale = isSelected ? 1.08 : 1;
  const hoverLift = hoverLiftTransition(theme.animationPreset);

  return (
    <motion.button
      type="button"
      layout
      initial={drawIn.initial}
      animate={{ scale: targetScale, opacity: isValid ? 1 : 0.55 }}
      transition={drawIn.transition}
      whileHover={isValid ? { scale: hoverLift.scale } : undefined}
      aria-label={`${chip.color} ${chip.shape}`}
      data-testid={`chip-${chip.color}-${chip.shape}`}
      data-selected={isSelected}
      data-valid={isValid}
      data-size={size}
      data-variant={variant}
      onClick={onClick}
      style={{
        alignItems: "center",
        background: "transparent",
        borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-md)",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        height: dim,
        justifyContent: "center",
        outline: isSelected
          ? isNeo
            ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
            : "2px solid var(--color-text-accent)"
          : "0",
        outlineOffset: "2px",
        padding: 4,
        border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : "none",
        boxShadow: isSelected
          ? isNeo
            ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
            : "0 0 0 2px var(--color-text-accent), 0 4px 12px rgba(0,0,0,0.3), 0 0 16px rgba(245, 158, 11, 0.25)"
          : isNeo
            ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
            : "0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)",
        transition: isNeo ? "var(--neo-transition)" : "box-shadow 150ms ease-out, transform 150ms ease-out",
        width: dim,
      }}
    >
      <svg aria-hidden="true" height="100%" viewBox="0 0 40 40" width="100%">
        {!isNeo && (
        <defs>
          <linearGradient id={`chip-grad-${colorIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={chipColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={chipColor} stopOpacity="0.7" />
          </linearGradient>
          <filter id="chip-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>
        )}

        {/* Layer 1: Drop shadow */}
        <rect x="2" y="2" width="36" height="36" rx="8" fill="rgba(0,0,0,0.3)" />

        {/* Layer 2: Colored background */}
        <rect x="0" y="0" width="40" height="40" rx="8" fill={isNeo ? chipColor : `url(#chip-grad-${colorIndex})`} filter={isNeo ? undefined : "url(#chip-shadow)"} />

        {/* Layer 3: Shape silhouette */}
        <path
          d={svgPath}
          fill={isNeo ? "#000000" : "rgba(255,255,255,0.85)"}
          stroke={isNeo ? "#000000" : "rgba(255,255,255,0.3)"}
          strokeWidth={isNeo ? "1" : "0.5"}
          strokeLinejoin="round"
        />

        {/* Layer 4: Top highlight for 3D effect (refined only) */}
        {!isNeo && (
        <rect x="2" y="2" width="36" height="18" rx="8" fill="rgba(255,255,255,0.15)" />
        )}

        {/* Layer 4b: Specular sheen ellipse (refined only) */}
        {!isNeo && (
        <ellipse cx="14" cy="12" rx="10" ry="6" fill="url(#chip-sheen)" />
        )}

        {/* Layer 5: Red vignette overlay for invalid state */}
        {!isValid && (
          <rect x="0" y="0" width="40" height="40" rx="8" fill="rgba(180, 40, 40, 0.4)" />
        )}
      </svg>
    </motion.button>
  );
}
