import type { ClientToServerEvents, ServerToClientEvents } from '@town77/shared-types'
import { type Socket, io } from 'socket.io-client'

const SERVER_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL
    ? (import.meta.env.VITE_SERVER_URL as string)
    : ''

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: false,
})
