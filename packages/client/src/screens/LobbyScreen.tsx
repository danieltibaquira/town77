import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { PlayerBadge } from '../components/PlayerBadge'
import { useGameStore } from '../store/gameStore'
import { useTheme } from '../lib/theme'
import { useRoomRecovery } from '../hooks/useRoomRecovery'
import { isCafeQueueState } from '@town77/shared-types'

export function LobbyScreen() {
  const { t } = useTranslation('game')
  const { t: tc } = useTranslation('common')
  const { code: routeCode } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;

  const connected = useGameStore((s) => s.connected)
  const gameState = useGameStore((s) => s.gameState)
  const playerId = useGameStore((s) => s.playerId)
  const roomCode = useGameStore((s) => s.roomCode) ?? routeCode
  const startGame = useGameStore((s) => s.startGame)
  const startSoloGame = useGameStore((s) => s.startSoloGame)
  useRoomRecovery(routeCode)

  useEffect(() => {
    if (gameState?.phase === 'playing' && !isCafeQueueState(gameState)) {
      navigate(`/game/${roomCode}`)
    }
  }, [gameState, navigate, roomCode])

  if (isCafeQueueState(gameState)) {
    return <CafeQueueLobby gameState={gameState} playerId={playerId} roomCode={roomCode} connected={connected} startGame={startGame} />
  }

  if (!gameState || !playerId) {
    return (
      <main data-testid="lobby-screen" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {tc('connecting')}
      </main>
    )
  }

  const isHost = gameState.players[0]?.id === playerId
  const hasBot = gameState.players.some(p => p.id.startsWith('bot-'))
  const canStart = isHost && (gameState.players.length >= 2 || hasBot)

  async function handleCopyCode() {
    if (roomCode && navigator.clipboard) {
      await navigator.clipboard.writeText(roomCode)
    }
  }

  return (
    <main data-testid="lobby-screen" style={{ alignItems: 'center', background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', minHeight: '100vh', padding: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <span data-testid="room-code" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', fontWeight: 700, letterSpacing: '0.15em' }}>{roomCode}</span>
        <button type="button" data-testid="btn-copy-code" onClick={handleCopyCode} style={{
          background: 'var(--color-surface-cell)',
          border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : 'none',
          borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-sm)',
          color: 'var(--color-text-on-dark)',
          cursor: 'pointer',
          fontSize: 'var(--text-sm)',
          padding: 'var(--space-xs) var(--space-sm)',
          boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : undefined,
        }}>{tc('copy_code')}</button>
      </div>

      <span style={{ color: connected ? 'var(--color-surface-cell-valid)' : 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        {connected ? tc('connected') : tc('connecting')}
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%', maxWidth: 400 }}>
        {gameState.players.map((player, index) => (
          <PlayerBadge key={player.id} player={player} isCurrentTurn={index === gameState.turnIndex} isMyPlayer={player.id === playerId} />
        ))}
      </div>

      <div data-testid="lobby-config-summary" style={{
        background: 'var(--color-surface-grid)',
        borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-md)',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--text-sm)',
        padding: 'var(--space-sm) var(--space-md)',
        border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : undefined,
      }}>
        {gameState.config.grid.rows}×{gameState.config.grid.cols} · {gameState.config.chips.colors.length} colors · {gameState.config.chips.shapes.length} shapes
      </div>

      {isHost && (
        <button type="button" data-testid="btn-start-game" disabled={!canStart} onClick={hasBot ? startSoloGame : startGame} style={{
          background: canStart
            ? isNeo
              ? '#ffe66d'
              : 'var(--color-text-accent)'
            : 'var(--color-surface-cell)',
          border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : 'none',
          borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-lg)',
          color: canStart
            ? isNeo
              ? '#000000'
              : 'var(--color-surface-bg)'
            : 'var(--color-text-on-dark)',
          cursor: canStart ? 'pointer' : 'not-allowed',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          padding: 'var(--space-md) var(--space-xl)',
          boxShadow: isNeo && canStart ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : undefined,
        }}>
          {t('start_game')}
        </button>
      )}
    </main>
  )
}

function CafeQueueLobby({ gameState, playerId, roomCode, connected, startGame }: {
  gameState: import('@town77/shared-types').CafeQueueState
  playerId: string | null
  roomCode: string | undefined
  connected: boolean
  startGame: () => void
}) {
  const navigate = useNavigate()
  useEffect(() => {
    if (gameState.phase === 'playing') navigate(`/cafe-queue/game/${roomCode ?? ''}`)
  }, [gameState.phase, navigate, roomCode])
  const host = gameState.players[0]?.id === playerId
  const canStart = host && gameState.players.length >= gameState.config.minPlayers
  return (
    <main data-testid="cafe-queue-lobby" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', minHeight: '100vh', display: 'grid', alignContent: 'center', gap: 'var(--space-md)', padding: 'var(--space-xl)', textAlign: 'center' }}>
      <h1 style={{ margin: 0 }}>CAFE QUEUE</h1>
      <strong data-testid="room-code">{roomCode}</strong>
      <span>{connected ? 'Connected' : 'Connecting'}</span>
      <p>{gameState.players.length}/{gameState.config.maxPlayers} baristas</p>
      {gameState.players.map((player) => <div key={player.id} style={{ border: '2px solid #000', background: player.id === playerId ? '#ffe66d' : '#fff', color: '#000', padding: 'var(--space-sm)' }}>{player.name}{player.id === playerId ? ' · you' : ''}</div>)}
      {host && <button type="button" data-testid="btn-start-game" disabled={!canStart} onClick={startGame} style={{ padding: 'var(--space-md)', background: canStart ? '#4ecdc4' : '#777', color: '#000', border: '3px solid #000', fontWeight: 900 }}>START SERVICE</button>}
    </main>
  )
}
