import type { Theme } from "@town77/shared-types";
import { createContext, useContext } from "react";
import { getThemeById } from "../themes";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: getThemeById("neobrutalism"),
  setTheme: () => {},
});

const REFINED_TEXT = {
  primary: "#F0EAD6",
  secondary: "#9B92A8",
  accent: "#C4A35A",
} as const;

const NEO_TEXT = {
  primary: "#000000",
  secondary: "#333333",
  accent: "#ff6b6b",
} as const;

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useThemeStyle() {
  const { theme } = useTheme();
  return theme.style === "neobrutalism" ? "neo" : "refined";
}

export function injectTokens(theme: Theme): void {
  const root = document.documentElement;
  const style = root.style;

  root.setAttribute("data-theme", theme.id);

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

  const isNeo = theme.style === "neobrutalism";
  const text = isNeo ? NEO_TEXT : REFINED_TEXT;
  style.setProperty("--color-text-primary", text.primary);
  style.setProperty("--color-text-secondary", text.secondary);
  style.setProperty("--color-text-accent", text.accent);

  // Control/panel chrome surface. The board cell is intentionally dark so bright
  // chips pop; neo pairs black text, so its panels need a light surface instead.
  style.setProperty("--color-surface-panel", isNeo ? "#F2F2F2" : theme.surfaces.cell);
  style.setProperty("--color-surface-panel-hover", isNeo ? "#E2E2E2" : theme.surfaces.cellHover);

  const sp = theme.styleProps;
  style.setProperty("--neo-border-width", `${sp.borderWidth}px`);
  style.setProperty("--neo-border-color", sp.borderColor);
  style.setProperty("--neo-shadow-offset", `${sp.shadowOffset}px`);
  style.setProperty("--neo-shadow-color", sp.shadowColor);
  style.setProperty("--neo-radius", `${sp.borderRadius}px`);
  style.setProperty("--neo-border", `${sp.borderWidth}px solid ${sp.borderColor}`);
  style.setProperty("--neo-shadow", `${sp.shadowOffset}px ${sp.shadowOffset}px 0px ${sp.shadowColor}`);
  style.setProperty("--neo-shadow-hover", `${sp.shadowOffset + 2}px ${sp.shadowOffset + 2}px 0px ${sp.shadowColor}`);
  style.setProperty("--neo-shadow-active", `${sp.shadowOffset - 2}px ${sp.shadowOffset - 2}px 0px ${sp.shadowColor}`);

  const { animationPreset } = theme;
  style.setProperty("--motion-chip-place-stiffness", String(animationPreset.chipPlace.stiffness));
  style.setProperty("--motion-chip-place-damping", String(animationPreset.chipPlace.damping));
  style.setProperty("--motion-chip-invalid-duration", String(animationPreset.chipInvalid.duration));
  style.setProperty("--motion-draw-duration", String(animationPreset.chipDraw.duration));
  style.setProperty("--motion-celebrate-duration", String(animationPreset.celebrate.duration));
}
