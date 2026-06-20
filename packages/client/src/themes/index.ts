import type { Theme } from "@town77/shared-types";
import { neobrutalismTheme } from "./neobrutalism";
import { playfulPastelTheme } from "./playful-pastel";
import { town77Theme } from "./town77";

export type ThemeId = "town77" | "playful-pastel" | "neobrutalism";

export const THEMES: readonly Theme[] = [town77Theme, playfulPastelTheme, neobrutalismTheme] as const;

const byId = new Map<string, Theme>(THEMES.map((theme) => [theme.id, theme]));

const DEFAULT_THEME_ID: ThemeId = "neobrutalism";

export function getThemeById(id: ThemeId): Theme {
  const theme = byId.get(id);
  if (!theme) {
    throw new Error(`Unknown theme: ${id}`);
  }
  return theme;
}

/** Narrow an untrusted string to a known ThemeId. */
export function isValidThemeId(id: string): id is ThemeId {
  return byId.has(id);
}

/**
 * Resolve a theme id from an untrusted source. Falls back to the default
 * theme instead of throwing when the id is unknown.
 */
export function getThemeByIdSafe(id: string): Theme {
  return byId.get(id) ?? byId.get(DEFAULT_THEME_ID)!;
}
