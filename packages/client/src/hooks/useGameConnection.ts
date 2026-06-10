import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export function useGameConnection() {
  const connect = useGameStore((s) => s.connect)
  const disconnect = useGameStore((s) => s.disconnect)
  const connected = useGameStore((s) => s.connected)

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return { connected }
}
