import { useEffect, useState } from 'react'
import { DEFAULT_CAFE_QUEUE_CONFIG, isCafeQueueState } from '@town77/shared-types'
import { useNavigate } from 'react-router-dom'
import { generateRandomName } from '../lib/randomName'
import { useGameStore } from '../store/gameStore'

export function CafeQueueConfigScreen() {
  const navigate = useNavigate()
  const createRoom = useGameStore((state) => state.createRoom)
  const gameState = useGameStore((state) => state.gameState)
  const roomCode = useGameStore((state) => state.roomCode)
  const [name, setName] = useState(() => generateRandomName())

  useEffect(() => {
    if (isCafeQueueState(gameState) && roomCode) navigate(`/cafe-queue/room/${roomCode}`)
  }, [gameState, navigate, roomCode])

  function create(): void {
    const playerName = name.trim()
    if (!playerName) return
    localStorage.setItem('playerName', playerName)
    createRoom(DEFAULT_CAFE_QUEUE_CONFIG, 'neobrutalism', playerName)
  }

  return (
    <main data-testid="cafe-queue-config-screen" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', minHeight: '100vh', padding: 'var(--space-xl)', display: 'grid', alignContent: 'center', gap: 'var(--space-lg)', margin: '0 auto', maxWidth: 520 }}>
      <p style={{ fontWeight: 800, letterSpacing: '.08em', margin: 0 }}>CAFE QUEUE</p>
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Make drinks. Keep the queue moving.</h1>
      <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>2–4 players · finite ingredients · private cups</p>
      <label htmlFor="cafe-player-name">Your name</label>
      <input id="cafe-player-name" data-testid="cafe-player-name" value={name} onChange={(event) => setName(event.target.value)} style={{ padding: 'var(--space-md)', border: '2px solid #000', borderRadius: 0, color: '#000', background: '#fff' }} />
      <button type="button" data-testid="btn-create-cafe-queue" disabled={!name.trim()} onClick={create} style={{ padding: 'var(--space-md)', fontWeight: 900, background: '#ffe66d', color: '#000', border: '3px solid #000', boxShadow: '5px 5px 0 #000', cursor: name.trim() ? 'pointer' : 'not-allowed' }}>CREATE CAFE QUEUE ROOM</button>
    </main>
  )
}
