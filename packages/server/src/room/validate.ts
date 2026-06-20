export const MAX_PLAYER_NAME_LENGTH = 32

/**
 * Validate an untrusted player name. Returns the trimmed name when it is a
 * non-empty string within the length cap, otherwise null.
 */
export function validatePlayerName(name: unknown): string | null {
  if (typeof name !== 'string') return null
  const trimmed = name.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length > MAX_PLAYER_NAME_LENGTH) return null
  return trimmed
}
