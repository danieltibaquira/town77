import type { Theme } from "@town77/shared-types";
import { createContext, useContext } from "react";
import { town77Theme } from "../themes/town77";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: town77Theme,
  setTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function injectTokens(theme: Theme): void {
  const style = document.documentElement.style;
  style.setProperty("--color-surface-bg", theme.surfaces.background);
  style.setProperty("--color-surface-grid", theme.surfaces.grid);
  style.setProperty("--color-surface-cell", theme.surfaces.cell);
  style.setProperty("--color-surface-cell-hover", theme.surfaces.cellHover);
  style.setProperty("--color-surface-cell-valid", theme.surfaces.cellValid);
  style.setProperty("--color-surface-cell-invalid", theme.surfaces.cellInvalid);
  style.setProperty("--font-display", theme.fonts.display);
  style.setProperty("--font-ui", theme.fonts.ui);

  for (const [colorId, hex] of Object.entries(theme.colorPalette)) {
    style.setProperty(`--chip-${colorId}`, hex);
  }
}
