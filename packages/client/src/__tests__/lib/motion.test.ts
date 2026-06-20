import { afterEach, describe, expect, it, vi } from "vitest";
import { chipDrawInTransition, chipInvalidTransition, chipPlaceTransition, prefersReducedMotion } from "../../lib/motion";
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

  describe("chipDrawInTransition", () => {
    it("returns scale 0, opacity 0 initial and final values from preset", () => {
      const result = chipDrawInTransition(town77Theme.animationPreset, 0);
      expect(result.initial).toEqual({ scale: 0, opacity: 0 });
      expect(result.animate).toEqual({ scale: 1, opacity: 1 });
    });

    it("includes transition duration and ease from preset", () => {
      const result = chipDrawInTransition(town77Theme.animationPreset, 0);
      expect(result.transition.duration).toBe(town77Theme.animationPreset.chipDrawIn.duration);
      expect(result.transition.ease).toBe(town77Theme.animationPreset.chipDrawIn.ease);
    });

    it("applies stagger delay based on index * stagger", () => {
      const preset = town77Theme.animationPreset.chipDrawIn;
      const result0 = chipDrawInTransition(town77Theme.animationPreset, 0);
      const result3 = chipDrawInTransition(town77Theme.animationPreset, 3);
      const expectedDelay3 = 3 * preset.stagger;
      expect(result0.transition.delay).toBe(0);
      expect(result3.transition.delay).toBeCloseTo(expectedDelay3);
    });

    it("returns instant transition when reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      const result = chipDrawInTransition(town77Theme.animationPreset, 0);
      expect(result.transition).toEqual({ duration: 0 });
    });
  });
});
