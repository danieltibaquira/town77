import { describe, expect, it } from "vitest";
import { getThemeById, THEMES, type ThemeId } from "../../themes";
import { assertValidTheme } from "../helpers/theme-assertions";

describe("themes index", () => {
  it("exports at least town77 and playful-pastel", () => {
    const ids = THEMES.map((t) => t.id);
    expect(ids).toContain("town77");
    expect(ids).toContain("playful-pastel");
  });

  it("getThemeById returns theme for valid id", () => {
    expect(getThemeById("town77").id).toBe("town77");
  });

  it("getThemeById throws for unknown id", () => {
    expect(() => getThemeById("nope" as ThemeId)).toThrow();
  });

  it("every registered theme passes assertValidTheme", () => {
    for (const theme of THEMES) {
      assertValidTheme(theme);
    }
  });
});
