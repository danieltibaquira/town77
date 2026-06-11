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

export function chipDrawInTransition(preset: AnimationPreset, staggerIndex: number) {
  if (prefersReducedMotion()) {
    return {
      initial: { scale: 1, opacity: 1 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0 },
    }
  }
  return {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: {
      duration: preset.chipDrawIn.duration,
      ease: preset.chipDrawIn.ease,
      delay: staggerIndex * preset.chipDrawIn.stagger,
    },
  }
}

export function turnSweepTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { animation: "none" }
  }
  return { animation: `turn-sweep ${preset.turnSweep.duration}s ease-out` }
}

export function scorePopTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { duration: 0 }
  }
  return {
    type: "spring" as const,
    stiffness: preset.scorePop.stiffness,
    damping: preset.scorePop.damping,
    mass: preset.scorePop.mass,
  }
}

export function bagShakeTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { animation: "none" }
  }
  return { animation: `bag-shake ${preset.bagShake.duration}s ease-out` }
}

export function hoverLiftTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { scale: 1 }
  }
  return {
    scale: preset.hoverLift.scale,
  }
}

export function badgeGlowPulseTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { animation: "none" }
  }
  return { animation: `glow-pulse ${preset.badgeGlowPulse.duration}s ease-in-out infinite` }
}

export function exchangeFlashTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { animation: "none" }
  }
  return { animation: `exchange-flash ${preset.exchangeFlash.duration}s ease-out forwards` }
}

export function discardFadeTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { animation: "none" }
  }
  return { animation: `discard-fade ${preset.discardFade.duration}s ease-out forwards` }
}

export function cellEntranceTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { animation: "none" }
  }
  return { animation: `cell-entrance ${preset.cellEntrance.duration}s ease-out forwards` }
}

export function errorShakeTransition(preset: AnimationPreset) {
  if (prefersReducedMotion()) {
    return { animation: "none" }
  }
  return { animation: `error-shake ${preset.errorShake.duration}s ease-out forwards` }
}
