import { randomBytes } from 'crypto'

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function generatePlayerId(): string {
  return randomBytes(16).toString('hex')
}
