import type { Chip, ExchangeConfig } from "@town77/shared-types";

/**
 * Pick the chips to exchange from the selected chip's color group. The player
 * exchanges chips sharing the selected chip's color, requiring at least
 * config.min of that color and capped at config.max. Returns null when no chip
 * is selected or the color group is too small to exchange.
 */
export function selectExchangeSet(
  hand: Chip[],
  selectedChip: Chip | null,
  config: ExchangeConfig,
): Chip[] | null {
  if (!selectedChip) return null;
  const sameColor = hand.filter((c) => c.color === selectedChip.color);
  if (sameColor.length < config.min) return null;
  return sameColor.slice(0, config.max);
}
