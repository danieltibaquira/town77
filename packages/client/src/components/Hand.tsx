import type { Chip } from "@town77/shared-types";
import { useTheme } from "../lib/theme";
import { Chip as ChipComponent } from "./Chip";

interface HandProps {
  chips: Chip[];
  selectedChip: Chip | null;
  onSelect: (chip: Chip) => void;
}

function sameChip(a: Chip | null, b: Chip): boolean {
  return a !== null && a.color === b.color && a.shape === b.shape;
}

export function Hand({ chips, selectedChip, onSelect }: HandProps) {
  const { theme } = useTheme();

  return (
    <div
      data-testid="hand"
      style={{
        alignItems: "center",
        background: theme.surfaces.grid,
        borderRadius: "var(--radius-md)",
        display: "flex",
        gap: "var(--space-sm)",
        minHeight: "var(--layout-hand-h)",
        overflowX: "auto",
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
