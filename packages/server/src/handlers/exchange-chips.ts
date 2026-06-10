import type { ExchangeChipsPayload } from '@town77/shared-types'
import type { Io, Sock, Db } from '../app'

export function exchangeChipsHandler(_io: Io, _socket: Sock, _db: Db) {
  return (_payload: ExchangeChipsPayload) => {}
}
