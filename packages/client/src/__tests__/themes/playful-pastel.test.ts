import { describe, expect, it } from "vitest";
import { playfulPastelTheme } from "../../themes/playful-pastel";
import { assertValidTheme } from "../helpers/theme-assertions";

describe("playful-pastel theme", () => {
  it("is a valid theme", () => {
    assertValidTheme(playfulPastelTheme);
  });

  it("uses bouncier spring preset than town77", () => {
    expect(playfulPastelTheme.animationPreset.chipPlace.stiffness).toBeGreaterThan(260);
  });
});
