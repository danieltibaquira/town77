import { randomBytes } from 'crypto'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  const bytes = randomBytes(6)
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]!).join('')
}
