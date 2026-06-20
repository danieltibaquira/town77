import { afterEach, describe, expect, it, vi } from "vitest";
import {
  badgeGlowPulseTransition,
  bagShakeTransition,
  cellEntranceTransition,
  chipDrawInTransition,
  discardFadeTransition,
  errorShakeTransition,
  exchangeFlashTransition,
  hoverLiftTransition,
  scorePopTransition,
  turnSweepTransition,
} from "../../lib/motion";
import { town77Theme } from "../../themes/town77";
import { playfulPastelTheme } from "../../themes/playful-pastel";

const themes = [town77Theme, playfulPastelTheme];

describe("Wave 4 motion helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("turnSweepTransition", () => {
    it("returns animation CSS for turn indicator", () => {
      const result = turnSweepTransition(town77Theme.animationPreset);
      expect(result.animation).toContain("turn-sweep");
      expect(result.animation).toContain("s ease-out");
    });

    it("returns none for reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      expect(turnSweepTransition(town77Theme.animationPreset)).toEqual({ animation: "none" });
    });
  });

  describe("scorePopTransition", () => {
    it("returns spring config from preset", () => {
      const result = scorePopTransition(town77Theme.animationPreset);
      expect(result.type).toBe("spring");
      expect(result.stiffness).toBeGreaterThan(0);
      expect(result.damping).toBeGreaterThan(0);
      expect(result.mass).toBeGreaterThan(0);
    });

    it("returns instant for reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      expect(scorePopTransition(town77Theme.animationPreset)).toEqual({ duration: 0 });
    });
  });

  describe("bagShakeTransition", () => {
    it("returns animation CSS for bag shake", () => {
      const result = bagShakeTransition(town77Theme.animationPreset);
      expect(result.animation).toContain("bag-shake");
      expect(result.animation).toContain("s ease-out");
    });

    it("returns none for reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      expect(bagShakeTransition(town77Theme.animationPreset)).toEqual({ animation: "none" });
    });
  });

  describe("hoverLiftTransition", () => {
    it("returns scale from preset", () => {
      const result = hoverLiftTransition(town77Theme.animationPreset);
      expect(result.scale).toBeGreaterThan(1);
    });

    it("returns neutral scale for reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      expect(hoverLiftTransition(town77Theme.animationPreset)).toEqual({ scale: 1 });
    });
  });

  describe("badgeGlowPulseTransition", () => {
    it("returns animation CSS for glow pulse", () => {
      const result = badgeGlowPulseTransition(town77Theme.animationPreset);
      expect(result.animation).toContain("glow-pulse");
      expect(result.animation).toContain("infinite");
    });

    it("returns none for reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      expect(badgeGlowPulseTransition(town77Theme.animationPreset)).toEqual({ animation: "none" });
    });
  });

  describe("exchangeFlashTransition", () => {
    it("returns animation CSS for exchange flash", () => {
      const result = exchangeFlashTransition(town77Theme.animationPreset);
      expect(result.animation).toContain("exchange-flash");
    });

    it("returns none for reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      expect(exchangeFlashTransition(town77Theme.animationPreset)).toEqual({ animation: "none" });
    });
  });

  describe("discardFadeTransition", () => {
    it("returns animation CSS for discard fade", () => {
      const result = discardFadeTransition(town77Theme.animationPreset);
      expect(result.animation).toContain("discard-fade");
    });

    it("returns none for reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      expect(discardFadeTransition(town77Theme.animationPreset)).toEqual({ animation: "none" });
    });
  });

  describe("cellEntranceTransition", () => {
    it("returns animation CSS for cell entrance", () => {
      const result = cellEntranceTransition(town77Theme.animationPreset);
      expect(result.animation).toContain("cell-entrance");
    });

    it("returns none for reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      expect(cellEntranceTransition(town77Theme.animationPreset)).toEqual({ animation: "none" });
    });
  });

  describe("errorShakeTransition", () => {
    it("returns animation CSS for error shake", () => {
      const result = errorShakeTransition(town77Theme.animationPreset);
      expect(result.animation).toContain("error-shake");
    });

    it("returns none for reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
      expect(errorShakeTransition(town77Theme.animationPreset)).toEqual({ animation: "none" });
    });
  });

  describe("chipDrawInTransition", () => {
    it("returns scale 0, opacity 0 initial for all themes", () => {
      for (const theme of themes) {
        const result = chipDrawInTransition(theme.animationPreset, 0);
        expect(result.initial).toEqual({ scale: 0, opacity: 0 });
      }
    });
  });
})
