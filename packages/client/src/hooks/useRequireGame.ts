import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function useRequireGame() {
  const navigate = useNavigate()
  const gameState = useGameStore((s) => s.gameState)

  useEffect(() => {
    if (!gameState) {
      navigate('/')
    }
  }, [gameState, navigate])
}
