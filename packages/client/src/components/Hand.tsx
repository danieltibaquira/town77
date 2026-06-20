import type { Chip } from "@town77/shared-types";
import { Chip as ChipComponent } from "./Chip";
import { useTheme } from "../lib/theme";

type HandLayoutMode = "scrolling" | "stacked" | "compact";

interface HandProps {
  chips: Chip[];
  selectedChip: Chip | null;
  layoutMode?: HandLayoutMode;
  onSelect: (chip: Chip) => void;
}

function sameChip(a: Chip | null, b: Chip): boolean {
  return a !== null && a.color === b.color && a.shape === b.shape;
}

export function Hand({ chips, selectedChip, layoutMode = "scrolling", onSelect }: HandProps) {
  const { theme } = useTheme();
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;
  const isStacked = layoutMode === "stacked" || layoutMode === "compact";

  return (
    <div
      data-testid="hand"
      data-layout={layoutMode}
      style={{
        alignItems: "center",
        background: isNeo ? theme.surfaces.grid : "var(--color-surface-grid)",
        backgroundImage: isNeo ? "none" : "var(--surface-felt-grad)",
        backgroundBlendMode: isNeo ? "normal" : "overlay",
        borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-lg)",
        border: isNeo
          ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
          : "2px solid rgba(196, 163, 90, 0.12)",
        boxShadow: isNeo
          ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
          : "var(--shadow-md), var(--shadow-inner-xs)",
        display: "flex",
        flexWrap: isStacked ? "wrap" : "nowrap",
        gap: layoutMode === "compact" ? "var(--space-xs)" : "var(--space-md)",
        minHeight: "var(--layout-hand-h)",
        overflowX: isStacked ? "visible" : "auto",
        padding: "var(--space-md)",
      }}
    >
      {chips.map((chip, index) => (
        <div
          key={`${chip.color}-${chip.shape}-${index}`}
          style={{
            flex: "0 0 var(--layout-cell)",
            height: "var(--layout-cell)",
          }}
        >
          <ChipComponent
            chip={chip}
            isSelected={sameChip(selectedChip, chip)}
            isValid={true}
            fill
            staggerIndex={index}
            onClick={() => onSelect(chip)}
          />
        </div>
      ))}
    </div>
  );
}
