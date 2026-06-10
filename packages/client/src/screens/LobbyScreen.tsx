import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { PlayerBadge } from '../components/PlayerBadge'
import { useGameConnection } from '../hooks/useGameConnection'
import { useGameStore } from '../store/gameStore'

export function LobbyScreen() {
  const { t } = useTranslation('game')
  const { t: tc } = useTranslation('common')
  const { code: routeCode } = useParams<{ code: string }>()

  const { connected } = useGameConnection()
  const gameState = useGameStore((s) => s.gameState)
  const playerId = useGameStore((s) => s.playerId)
  const roomCode = useGameStore((s) => s.roomCode) ?? routeCode
  const startGame = useGameStore((s) => s.startGame)
  const joinRoom = useGameStore((s) => s.joinRoom)

  useEffect(() => {
    if (gameState) return
    const token = localStorage.getItem('sessionToken')
    const storedPlayerId = localStorage.getItem('playerId')
    const storedName = localStorage.getItem('playerName')
    if (token && storedPlayerId && storedName && routeCode) {
      joinRoom(routeCode, storedName, storedPlayerId, token)
    }
  }, [gameState, joinRoom, routeCode])

  if (!gameState || !playerId) {
    return (
      <main data-testid="lobby-screen" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {tc('connecting')}
      </main>
    )
  }

  const isHost = gameState.players[0]?.id === playerId
  const canStart = isHost && gameState.players.length >= 2

  async function handleCopyCode() {
    if (roomCode && navigator.clipboard) {
      await navigator.clipboard.writeText(roomCode)
    }
  }

  return (
    <main data-testid="lobby-screen" style={{ alignItems: 'center', background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', minHeight: '100vh', padding: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <span data-testid="room-code" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', fontWeight: 700, letterSpacing: '0.15em' }}>{roomCode}</span>
        <button type="button" data-testid="btn-copy-code" onClick={handleCopyCode} style={{ background: 'var(--color-surface-cell)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', padding: 'var(--space-xs) var(--space-sm)' }}>{tc('copy_code')}</button>
      </div>

      <span style={{ color: connected ? 'var(--color-surface-cell-valid)' : 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        {connected ? tc('connected') : tc('connecting')}
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%', maxWidth: 400 }}>
        {gameState.players.map((player, index) => (
          <PlayerBadge key={player.id} player={player} isCurrentTurn={index === gameState.turnIndex} isMyPlayer={player.id === playerId} />
        ))}
      </div>

      <div data-testid="lobby-config-summary" style={{ background: 'var(--color-surface-grid)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', padding: 'var(--space-sm) var(--space-md)' }}>
        {gameState.config.grid.rows}×{gameState.config.grid.cols} · {gameState.config.chips.colors.length} colors · {gameState.config.chips.shapes.length} shapes
      </div>

      {isHost && (
        <button type="button" data-testid="btn-start-game" disabled={!canStart} onClick={startGame} style={{ background: canStart ? 'var(--color-text-accent)' : 'var(--color-surface-cell)', border: 'none', borderRadius: 'var(--radius-lg)', color: 'var(--color-surface-bg)', cursor: canStart ? 'pointer' : 'not-allowed', fontSize: 'var(--text-lg)', fontWeight: 700, padding: 'var(--space-md) var(--space-xl)' }}>
          {t('start_game')}
        </button>
      )}
    </main>
  )
}
