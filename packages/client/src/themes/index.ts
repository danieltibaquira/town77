import type { Theme } from "@town77/shared-types";
import { playfulPastelTheme } from "./playful-pastel";
import { town77Theme } from "./town77";

export type ThemeId = "town77" | "playful-pastel";

export const THEMES: readonly Theme[] = [town77Theme, playfulPastelTheme] as const;

const byId = new Map<string, Theme>(THEMES.map((theme) => [theme.id, theme]));

export function getThemeById(id: ThemeId): Theme {
  const theme = byId.get(id);
  if (!theme) {
    throw new Error(`Unknown theme: ${id}`);
  }
  return theme;
}
