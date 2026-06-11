import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { generateRandomName } from '../lib/randomName'
import { useGameStore } from '../store/gameStore'

export function JoinScreen() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const joinRoom = useGameStore((s) => s.joinRoom)

  const [playerName, setPlayerName] = useState(() => generateRandomName())
  const [roomCode, setRoomCode] = useState('')

  const canJoin = playerName.trim().length > 0 && roomCode.trim().length > 0

  function handleJoin() {
    if (!canJoin) return
    const code = roomCode.trim().toUpperCase()
    localStorage.setItem('playerName', playerName.trim())
    joinRoom(code, playerName.trim())
    navigate(`/room/${code}`)
  }

  const inputStyle = {
    background: 'var(--color-surface-cell)',
    border: '1px solid var(--color-surface-cell-hover)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--text-base)',
    padding: 'var(--space-sm) var(--space-md)',
    width: '100%',
  }

  return (
    <main
      data-testid="join-screen"
      style={{
        alignItems: 'center',
        background: 'var(--color-surface-bg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-xl)',
      }}
    >
      <button
        type="button"
        data-testid="btn-back"
        onClick={() => navigate('/')}
        style={{
          alignSelf: 'flex-start',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontSize: 'var(--text-base)',
        }}
      >
        ← {t('back')}
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', margin: 0 }}>
        {t('join')}
      </h1>

      <input
        data-testid="input-join-name"
        placeholder={t('your_name')}
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        style={inputStyle}
      />

      <input
        data-testid="input-room-code"
        placeholder="ABC123"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        maxLength={6}
        style={{
          ...inputStyle,
          textAlign: 'center',
          letterSpacing: '0.2em',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
        }}
      />

      <button
        type="button"
        data-testid="btn-join-room"
        disabled={!canJoin}
        onClick={handleJoin}
        style={{
          background: canJoin ? 'var(--color-text-accent)' : 'var(--color-surface-cell)',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-surface-bg)',
          cursor: canJoin ? 'pointer' : 'not-allowed',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          padding: 'var(--space-md) var(--space-xl)',
        }}
      >
        {t('join')}
      </button>
    </main>
  )
}
