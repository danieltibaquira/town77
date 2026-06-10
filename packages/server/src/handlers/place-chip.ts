import type { PlaceChipPayload } from '@town77/shared-types'
import type { Io, Sock, Db } from '../app'

export function placeChipHandler(_io: Io, _socket: Sock, _db: Db) {
  return (_payload: PlaceChipPayload) => {}
}
