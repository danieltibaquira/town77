import type { JoinRoomPayload } from '@town77/shared-types'
import type { Io, Sock, Db } from '../app'

export function joinRoomHandler(_io: Io, _socket: Sock, _db: Db) {
  return (_payload: JoinRoomPayload) => {}
}
