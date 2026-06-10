import type { DiscardChipPayload } from '@town77/shared-types'
import type { Io, Sock, Db } from '../app'

export function discardChipHandler(_io: Io, _socket: Sock, _db: Db) {
  return (_payload: DiscardChipPayload) => {}
}
