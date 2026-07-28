import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

function getSavedSession(routeCode: string | undefined) {
  if (!routeCode || typeof localStorage === 'undefined') return null

  const roomCode = localStorage.getItem('roomCode')
  const playerId = localStorage.getItem('playerId')
  const playerName = localStorage.getItem('playerName')
  const sessionToken = localStorage.getItem('sessionToken')
  if (roomCode !== routeCode || !playerId || !playerName || !sessionToken) return null

  return { playerId, playerName, sessionToken }
}

export function hasSavedRoomSession(routeCode: string | undefined): boolean {
  return getSavedSession(routeCode) !== null
}

export function useRoomRecovery(routeCode: string | undefined): boolean {
  const connected = useGameStore((state) => state.connected)
  const gameState = useGameStore((state) => state.gameState)
  const joinRoom = useGameStore((state) => state.joinRoom)
  const attemptedWhileConnected = useRef(false)
  const savedSession = getSavedSession(routeCode)

  useEffect(() => {
    if (!connected) {
      attemptedWhileConnected.current = false
      return
    }
    if (gameState || attemptedWhileConnected.current || !routeCode || !savedSession) return

    attemptedWhileConnected.current = true
    joinRoom(routeCode, savedSession.playerName, savedSession.playerId, savedSession.sessionToken)
  }, [connected, gameState, joinRoom, routeCode, savedSession])

  return connected && !gameState && savedSession !== null
}
