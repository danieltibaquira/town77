import { createHash } from 'node:crypto'
import type { Grid } from '@town77/shared-types'

export function computeBoardHash(grid: Grid): string {
  return createHash('sha256').update(JSON.stringify(grid)).digest('hex')
}
