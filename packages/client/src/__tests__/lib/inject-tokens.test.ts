import { beforeEach, describe, expect, it } from "vitest";
import { injectTokens } from "../../lib/theme";
import { town77Theme } from "../../themes/town77";

describe("injectTokens — motion semantics", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
  });

  it("sets --motion-chip-place-stiffness from animationPreset", () => {
    injectTokens(town77Theme);
    expect(document.documentElement.style.getPropertyValue("--motion-chip-place-stiffness")).toBe(
      "260",
    );
  });

  it("sets --motion-chip-invalid-duration", () => {
    injectTokens(town77Theme);
    expect(document.documentElement.style.getPropertyValue("--motion-chip-invalid-duration")).toBe(
      "0.3",
    );
  });

  it("sets default text semantics", () => {
    injectTokens(town77Theme);
    expect(document.documentElement.style.getPropertyValue("--color-text-primary")).toBe("#F0EAD6");
  });
});
