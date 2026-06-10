import type { AnimationPreset } from "@town77/shared-types";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function chipPlaceTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return {
    type: preset.chipPlace.type,
    stiffness: preset.chipPlace.stiffness,
    damping: preset.chipPlace.damping,
    mass: preset.chipPlace.mass,
  };
}

export function chipInvalidTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return {
    x: preset.chipInvalid.x,
    transition: { duration: preset.chipInvalid.duration },
  };
}

export function cellPulseTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return {
    transition: {
      duration: preset.cellPulse.duration,
      repeat: preset.cellPulse.repeat,
    },
  };
}
