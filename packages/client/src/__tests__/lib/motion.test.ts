import { afterEach, describe, expect, it, vi } from "vitest";
import { chipInvalidTransition, chipPlaceTransition, prefersReducedMotion } from "../../lib/motion";
import { town77Theme } from "../../themes/town77";

describe("motion utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chipPlaceTransition returns spring from preset", () => {
    const transition = chipPlaceTransition(town77Theme.animationPreset);
    expect(transition).toMatchObject({ type: "spring", stiffness: 260 });
  });

  it("chipInvalidTransition returns x keyframes from preset", () => {
    const transition = chipInvalidTransition(town77Theme.animationPreset);
    expect(transition).toMatchObject({ x: [-6, 6, -4, 4, 0] });
  });

  it("prefersReducedMotion returns true when matchMedia prefers reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    expect(prefersReducedMotion()).toBe(true);
  });

  it("chipPlaceTransition returns instant when reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    expect(chipPlaceTransition(town77Theme.animationPreset)).toEqual({ duration: 0 });
  });
});
