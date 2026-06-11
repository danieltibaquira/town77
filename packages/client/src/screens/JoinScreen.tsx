import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { generateRandomName } from '../lib/randomName'
import { useTheme } from '../lib/theme'

export function JoinScreen() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;
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
    border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : '1px solid var(--color-surface-cell-hover)',
    borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-md)',
    color: isNeo ? '#000000' : 'var(--color-text-primary)',
    fontSize: 'var(--text-base)',
    padding: 'var(--space-sm) var(--space-md)',
    width: '100%',
    boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : undefined,
  }

  return (
    <main data-testid="join-screen" style={{ alignItems: 'center', background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', justifyContent: 'center', minHeight: '100vh', padding: 'var(--space-xl)' }}>
      <button type="button" data-testid="btn-back" onClick={() => navigate('/')} style={{
        alignSelf: 'flex-start',
        background: 'transparent',
        border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : 'none',
        borderRadius: isNeo ? `${neoRadius}px` : undefined,
        color: isNeo ? '#000000' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontSize: 'var(--text-base)',
        padding: isNeo ? 'var(--space-xs) var(--space-sm)' : undefined,
      }}>
        ← {t('back')}
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', margin: 0 }}>{t('join')}</h1>

      <input data-testid="input-join-name" placeholder={t('your_name')} value={playerName} onChange={(e) => setPlayerName(e.target.value)} style={inputStyle} />

      <input data-testid="input-room-code" placeholder="ABC123" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} maxLength={6} style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.2em', fontSize: 'var(--text-lg)', fontWeight: 700 }} />

      <button type="button" data-testid="btn-join-room" disabled={!canJoin} onClick={handleJoin} style={{
        background: canJoin
          ? isNeo
            ? '#ffe66d'
            : 'var(--color-text-accent)'
          : 'var(--color-surface-cell)',
        border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : 'none',
        borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-lg)',
        color: canJoin
          ? isNeo
            ? '#000000'
            : 'var(--color-surface-bg)'
          : 'var(--color-text-secondary)',
        cursor: canJoin ? 'pointer' : 'not-allowed',
        fontSize: 'var(--text-lg)',
        fontWeight: 700,
        padding: 'var(--space-md) var(--space-xl)',
        boxShadow: isNeo && canJoin ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : undefined,
      }}>
        {t('join')}
      </button>
    </main>
  )
}
