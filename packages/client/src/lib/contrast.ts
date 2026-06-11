function parseHexColor(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = Number.parseInt(cleaned.substring(0, 2), 16) / 255
  const g = Number.parseInt(cleaned.substring(2, 4), 16) / 255
  const b = Number.parseInt(cleaned.substring(4, 6), 16) / 255
  return [r, g, b]
}

function getLuminance([r, g, b]: [number, number, number]): number {
  const linear = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number]
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(parseHexColor(foreground))
  const l2 = getLuminance(parseHexColor(background))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsWcagAA(foreground: string, background: string, minRatio = 4.5): boolean {
  return contrastRatio(foreground, background) >= minRatio
}
