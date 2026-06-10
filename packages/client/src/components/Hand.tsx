import type { Chip } from "@town77/shared-types";
import { Chip as ChipComponent } from "./Chip";

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
  const isStacked = layoutMode === "stacked" || layoutMode === "compact";

  return (
    <div
      data-testid="hand"
      data-layout={layoutMode}
      style={{
        alignItems: "center",
        background: "var(--color-surface-grid)",
        borderRadius: "var(--radius-md)",
        display: "flex",
        flexWrap: isStacked ? "wrap" : "nowrap",
        gap: layoutMode === "compact" ? "var(--space-xs)" : "var(--space-sm)",
        minHeight: "var(--layout-hand-h)",
        overflowX: isStacked ? "visible" : "auto",
        padding: "var(--space-sm)",
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
            onClick={() => onSelect(chip)}
          />
        </div>
      ))}
    </div>
  );
}
