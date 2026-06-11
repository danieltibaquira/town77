import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ActionBar } from '../components/ActionBar'
import { Grid } from '../components/Grid'
import { Hand } from '../components/Hand'
import { PlayerBadge } from '../components/PlayerBadge'
import { Toast } from '../components/Toast'
import { useRequireGame } from '../hooks/useRequireGame'
import { useValidCells } from '../hooks/useValidCells'
import { bagShakeTransition, exchangeFlashTransition, turnSweepTransition } from '../lib/motion'
import { useTheme } from '../lib/theme'
import { useGameStore } from '../store/gameStore'

export function GameScreen() {
  useRequireGame()
  const { t } = useTranslation('game')
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isNeo = theme.style === 'neobrutalism'
  const neoRadius = theme.styleProps.borderRadius

  const connected = useGameStore((s) => s.connected)
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

  const prevBagLength = useRef(gameState?.bag.length ?? 0)
  const [bagShakeKey, setBagShakeKey] = useState(0)
  useEffect(() => {
    const current = gameState?.bag.length ?? 0
    if (current !== prevBagLength.current) {
      setBagShakeKey((k) => k + 1)
      prevBagLength.current = current
    }
  }, [gameState?.bag.length])

  const [flashKey, setFlashKey] = useState(0)
  const handleExchange = () => {
    setFlashKey((k) => k + 1)
    exchangeChips([])
  }

  useEffect(() => {
    if (gameState?.phase === 'finished') {
      navigate(`/results/${roomCode ?? ''}`)
    }
  }, [gameState?.phase, navigate, roomCode])

  if (!gameState || !playerId) {
    return (
      <main
        data-testid="game-screen"
        style={{
          background: isNeo ? theme.surfaces.background : 'var(--color-surface-bg)',
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
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

  function handleDiscard() {
    if (!selectedChip) return
    discardChip(selectedChip)
    selectChip(null)
  }

  const canExchange =
    isMyTurn && myPlayer !== undefined && myPlayer.hand.length >= gameState.config.exchange.min
  const canDiscard =
    isMyTurn && myPlayer !== undefined && !myPlayer.hasDiscarded && selectedChip !== null

  const turnSweep = turnSweepTransition(theme.animationPreset)
  const bagShake = bagShakeTransition(theme.animationPreset)
  const exchangeFlash = exchangeFlashTransition(theme.animationPreset)

  return (
    <main
      data-testid="game-screen"
      style={{
        background: isNeo ? theme.surfaces.background : 'var(--color-surface-bg)',
        backgroundImage: isNeo
          ? 'none'
          : 'radial-gradient(ellipse at 50% 0%, rgba(196, 163, 90, 0.08) 0%, transparent 60%)',
        color: 'var(--color-text-primary)',
        containerType: 'inline-size',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          padding: 'var(--space-md) var(--space-lg)',
          flexWrap: 'wrap',
          borderBottom: isNeo
            ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
            : '1px solid rgba(196, 163, 90, 0.1)',
        }}
      >
        {gameState.players.map((player, index) => (
          <PlayerBadge
            key={player.id}
            player={player}
            isCurrentTurn={index === gameState.turnIndex}
            isMyPlayer={player.id === playerId}
            size="sm"
            variant="compact"
          />
        ))}
        <span
          key={bagShakeKey}
          data-testid="bag-count"
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
            marginLeft: 'auto',
            ...bagShake,
          }}
        >
          {gameState.bag.length}
        </span>
      </header>

      <div
        key={isMyTurn ? 'my-turn' : 'waiting'}
        data-testid="turn-indicator"
        style={{
          color: isMyTurn ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
          fontSize: 'var(--text-lg)',
          fontWeight: isMyTurn ? 700 : 400,
          padding: 'var(--space-sm) var(--space-md)',
          textAlign: 'center',
          letterSpacing: isNeo ? '0.02em' : '0.05em',
          ...turnSweep,
        }}
      >
        {isMyTurn ? t('your_turn') : t('waiting')}
      </div>

      <div
        data-testid="game-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-lg)',
          padding: 'var(--space-md)',
          contain: 'var(--layout-contain)',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-md)' }}>
          <Grid
            grid={gameState.grid}
            validCells={validCells}
            {...(isMyTurn ? { onCellClick: handleCellClick } : {})}
          />
        </div>

        <div
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            position: 'relative',
            maxWidth: 600,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <Hand
            chips={myPlayer?.hand ?? []}
            selectedChip={selectedChip}
            onSelect={isMyTurn ? selectChip : () => {}}
          />
          <div
            key={flashKey}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-md)',
              pointerEvents: 'none',
              ...exchangeFlash,
            }}
          />
        </div>

        <ActionBar
          canExchange={canExchange}
          canDiscard={canDiscard}
          onExchange={handleExchange}
          onDiscard={handleDiscard}
        />
      </div>

      {lastError && <Toast message={lastError.messageKey} onDismiss={clearError} />}
    </main>
  )
}
