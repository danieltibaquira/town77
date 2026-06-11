import { useTheme } from '../lib/theme'

export function ChipDefs() {
  const { theme } = useTheme()
  const colors = theme.colorPalette

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* Chip color gradients — 3-stop for 3D emboss effect */}
        {Object.entries(colors).map(([id, color], index) => {
          const lighter = adjustColor(color, 20)
          const darker = adjustColor(color, -20)
          return (
            <linearGradient key={id} id={`chip-grad-${index + 1}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={lighter} />
              <stop offset="50%" stopColor={color} />
              <stop offset="100%" stopColor={darker} />
            </linearGradient>
          )
        })}

        {/* Drop shadow filter for chip depth */}
        <filter id="chip-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0, 0, 0, 1)" floodOpacity="0.35" />
        </filter>

        {/* Specular highlight gradient for sheen effect */}
        <radialGradient id="chip-sheen" cx="40%" cy="35%" r="50%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </radialGradient>
      </defs>
    </svg>
  )
}

function adjustColor(hex: string, amount: number): string {
  const num = Number.parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
