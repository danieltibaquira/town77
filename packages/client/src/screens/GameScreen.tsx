import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ActionBar } from '../components/ActionBar'
import { Grid } from '../components/Grid'
import { Hand } from '../components/Hand'
import { PlayerBadge } from '../components/PlayerBadge'
import { Toast } from '../components/Toast'
import { useGameConnection } from '../hooks/useGameConnection'
import { useRequireGame } from '../hooks/useRequireGame'
import { useValidCells } from '../hooks/useValidCells'
import { useGameStore } from '../store/gameStore'

export function GameScreen() {
  useRequireGame()
  const { t } = useTranslation('game')
  const navigate = useNavigate()

  const { connected } = useGameConnection()
  const gameState = useGameStore((s) => s.gameState)
  const playerId = useGameStore((s) => s.playerId)
  const roomCode = useGameStore((s) => s.roomCode)
  const selectedChip = useGameStore((s) => s.selectedChip)
  const lastError = useGameStore((s) => s.lastError)
  const selectChip = useGameStore((s) => s.selectChip)
  const placeChip = useGameStore((s) => s.placeChip)
  const exchangeChips = useGameStore((s) => s.exchangeChips)
  const discardChip = useGameStore((s) => s.discardChip)
  const clearError = useGameStore((s) => s.clearError)

  // Auto-nav to results when game ends
  useEffect(() => {
    if (gameState?.phase === 'finished') {
      navigate(`/results/${roomCode ?? ''}`)
    }
  }, [gameState?.phase, navigate, roomCode])

  if (!gameState || !playerId) {
    return (
      <main data-testid="game-screen" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {t('waiting')}
      </main>
    )
  }

  const myPlayer = gameState.players.find((p) => p.id === playerId)
  const isMyTurn = gameState.players[gameState.turnIndex]?.id === playerId
  const validCells = useValidCells(gameState.grid, selectedChip)

  function handleCellClick(row: number, col: number) {
    if (!selectedChip || !isMyTurn) return
    placeChip(selectedChip, row, col)
    selectChip(null)
  }

  function handleExchange() {
    exchangeChips([])
  }

  function handleDiscard() {
    if (!selectedChip) return
    discardChip(selectedChip)
    selectChip(null)
  }

  const canExchange = isMyTurn && myPlayer !== undefined && myPlayer.hand.length >= gameState.config.exchange.min
  const canDiscard = isMyTurn && myPlayer !== undefined && !myPlayer.hasDiscarded && selectedChip !== null

  return (
    <main data-testid="game-screen" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', flexWrap: 'wrap' }}>
        {gameState.players.map((player, index) => (
          <PlayerBadge key={player.id} player={player} isCurrentTurn={index === gameState.turnIndex} isMyPlayer={player.id === playerId} size="sm" variant="compact" />
        ))}
        <span data-testid="bag-count" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginLeft: 'auto' }}>{gameState.bag.length}</span>
      </header>

      <div data-testid="turn-indicator" style={{ color: isMyTurn ? 'var(--color-text-accent)' : 'var(--color-text-secondary)', fontSize: 'var(--text-base)', fontWeight: isMyTurn ? 700 : 400, padding: 'var(--space-xs) var(--space-md)', textAlign: 'center' }}>
        {isMyTurn ? t('your_turn') : t('waiting')}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-sm)' }}>
        <Grid grid={gameState.grid} validCells={validCells} {...(isMyTurn ? { onCellClick: handleCellClick } : {})} />
      </div>

      <div style={{ padding: 'var(--space-sm) var(--space-md)' }}>
        <Hand chips={myPlayer?.hand ?? []} selectedChip={selectedChip} onSelect={isMyTurn ? selectChip : () => {}} />
      </div>

      <ActionBar canExchange={canExchange} canDiscard={canDiscard} onExchange={handleExchange} onDiscard={handleDiscard} />

      {lastError && <Toast message={lastError.messageKey} onDismiss={clearError} />}
    </main>
  )
}
