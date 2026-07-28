import type { Chip, ExchangeConfig } from "@town77/shared-types";

/**
 * Pick chips sharing either the selected chip's color or shape. A color group
 * takes precedence when both are available; each group must meet config.min.
 */
export function selectExchangeSet(
  hand: Chip[],
  selectedChip: Chip | null,
  config: ExchangeConfig,
): Chip[] | null {
  if (!selectedChip) return null;
  const sameColor = hand.filter((c) => c.color === selectedChip.color);
  if (sameColor.length >= config.min) return sameColor.slice(0, config.max);
  const sameShape = hand.filter((c) => c.shape === selectedChip.shape);
  if (sameShape.length < config.min) return null;
  return sameShape.slice(0, config.max);
}
