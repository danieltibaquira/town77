import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DEFAULT_GAME_CONFIG } from '@town77/shared-types'
import type { GameConfig } from '@town77/shared-types'
import { Stepper } from '../components/Stepper'
import { ThemeCard } from '../components/ThemeCard'
import { generateRandomName } from '../lib/randomName'
import { useTheme } from '../lib/theme'
import { useGameStore } from '../store/gameStore'
import { getThemeById, THEMES, type ThemeId } from '../themes'

export function ConfigScreen() {
  const { t } = useTranslation('config')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createRoom = useGameStore((s) => s.createRoom)
  const createSoloRoom = useGameStore((s) => s.createSoloRoom)
  const gameState = useGameStore((s) => s.gameState)
  const roomCode = useGameStore((s) => s.roomCode)
  const simulationSeed = searchParams.get('seed')
  const { theme, setTheme } = useTheme()
  const isNeo = theme.style === 'neobrutalism'
  const neoRadius = theme.styleProps.borderRadius

  useEffect(() => {
    if (gameState && roomCode) {
      navigate(`/room/${roomCode}`)
    }
  }, [gameState, roomCode, navigate])

  const [playerName, setPlayerName] = useState(() => generateRandomName())
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>('town77')
  const [gridSize, setGridSize] = useState(DEFAULT_GAME_CONFIG.grid.rows)
  const [colors, setColors] = useState(DEFAULT_GAME_CONFIG.chips.colors.length)
  const [shapes, setShapes] = useState(DEFAULT_GAME_CONFIG.chips.shapes.length)
  const [copies, setCopies] = useState(DEFAULT_GAME_CONFIG.chips.copies)
  const [handSize, setHandSize] = useState(DEFAULT_GAME_CONFIG.handSize)

  const totalChips = colors * shapes * copies
  const boardCells = gridSize * gridSize
  const showWarning = totalChips < boardCells
  const canCreate = playerName.trim().length > 0

  function applyPreset(preset: 'classic' | 'fast') {
    if (preset === 'classic') {
      setGridSize(7); setColors(7); setShapes(7); setCopies(1); setHandSize(4)
    } else {
      setGridSize(5); setColors(5); setShapes(5); setCopies(1); setHandSize(4)
    }
  }

  function buildConfig(): GameConfig {
    return {
      grid: { rows: gridSize, cols: gridSize },
      chips: {
        colors: Array.from({ length: colors }, (_, i) => `color-${i + 1}`),
        shapes: DEFAULT_GAME_CONFIG.chips.shapes.slice(0, shapes),
        copies,
      },
      handSize,
      scoring: DEFAULT_GAME_CONFIG.scoring,
      exchange: DEFAULT_GAME_CONFIG.exchange,
    }
  }

  function handleCreate() {
    if (!canCreate) return
    localStorage.setItem('playerName', playerName.trim())
    const seed = simulationSeed ? Number.parseInt(simulationSeed, 10) : undefined
    createRoom(buildConfig(), selectedThemeId, playerName.trim(), seed)
  }

  function handleSoloCreate() {
    if (!canCreate) return
    localStorage.setItem('playerName', playerName.trim())
    const seed = simulationSeed ? Number.parseInt(simulationSeed, 10) : undefined
    createSoloRoom(buildConfig(), selectedThemeId, playerName.trim(), seed)
  }

  function handleThemeSelect(themeId: ThemeId) {
    setSelectedThemeId(themeId)
    setTheme(getThemeById(themeId))
  }

  const inputStyle = {
    background: isNeo ? '#ffffff' : 'var(--color-surface-cell)',
    border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : '1px solid var(--color-surface-cell-hover)',
    borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-md)',
    boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : 'none',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--text-base)',
    padding: 'var(--space-sm) var(--space-md)',
  }

  const presetBtnStyle = {
    background: isNeo ? '#ffffff' : 'var(--color-surface-cell)',
    border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : 'none',
    borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-md)',
    boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : 'none',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    padding: 'var(--space-xs) var(--space-md)',
  }

  return (
    <main data-testid="config-screen" style={{
      background: isNeo ? theme.surfaces.background : 'var(--color-surface-bg)',
      color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column',
      gap: 'var(--space-lg)', margin: '0 auto', width: '100%', maxWidth: 560,
      minHeight: '100vh', padding: 'var(--space-md)', boxSizing: 'border-box'
    }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', margin: 0 }}>{tc('create_room')}</h1>

      <input data-testid="input-player-name" placeholder={tc('your_name')} value={playerName} onChange={(e) => setPlayerName(e.target.value)} style={inputStyle} />

      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <button type="button" data-testid="preset-classic" onClick={() => applyPreset('classic')} style={presetBtnStyle}>{t('preset_classic')}</button>
        <button type="button" data-testid="preset-fast" onClick={() => applyPreset('fast')} style={presetBtnStyle}>{t('preset_fast')}</button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-sm)', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {THEMES.map((themeItem) => (
          <ThemeCard key={themeItem.id} theme={themeItem} isSelected={themeItem.id === selectedThemeId} onClick={() => handleThemeSelect(themeItem.id as ThemeId)} />
        ))}
      </div>

      <div data-testid="config-grid"><Stepper label={t('grid_size')} value={gridSize} min={3} max={11} onChange={setGridSize} /></div>
      <div data-testid="config-colors"><Stepper label={t('colors')} value={colors} min={2} max={7} onChange={setColors} /></div>
      <div data-testid="config-shapes"><Stepper label={t('shapes')} value={shapes} min={2} max={7} onChange={setShapes} /></div>
      <div data-testid="config-copies"><Stepper label={t('copies')} value={copies} min={1} max={3} onChange={setCopies} /></div>
      <div data-testid="config-hand-size"><Stepper label={t('hand_size')} value={handSize} min={3} max={6} onChange={setHandSize} /></div>

      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        <span data-testid="config-total-chips">{t('total_chips', { count: totalChips })}</span><br />
        <span data-testid="config-board-cells">{t('board_cells', { count: boardCells })}</span>
      </div>

      {showWarning && <div data-testid="config-warning" style={{ color: 'var(--color-text-accent)', fontSize: 'var(--text-sm)' }}>{t('warning_chips_lt_cells')}</div>}

      <button type="button" data-testid="btn-create-room" disabled={!canCreate} onClick={handleCreate}
        style={{
          background: canCreate ? (isNeo ? '#ffe66d' : 'linear-gradient(180deg, #d4b76a 0%, #c4a35a 100%)') : 'var(--color-surface-cell)',
          border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : 'none',
          borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-lg)',
          color: canCreate ? (isNeo ? '#000000' : 'var(--color-surface-bg)') : 'var(--color-text-secondary)',
          cursor: canCreate ? 'pointer' : 'not-allowed', fontSize: 'var(--text-lg)', fontWeight: 700,
          padding: 'var(--space-md) var(--space-xl)', letterSpacing: '0.05em',
          boxShadow: canCreate && isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : (canCreate ? 'var(--shadow-md), 0 0 12px rgba(196, 163, 90, 0.2)' : 'none')
        }}>
        {tc('create_room')}
      </button>

      <button type="button" data-testid="btn-play-solo" disabled={!canCreate} onClick={handleSoloCreate}
        style={{
          background: canCreate ? (isNeo ? '#4ecdc4' : 'linear-gradient(135deg, rgba(196, 163, 90, 0.15) 0%, rgba(196, 163, 90, 0.05) 100%)') : 'var(--color-surface-cell)',
          border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : '2px solid var(--color-text-accent)',
          borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-lg)',
          color: canCreate ? (isNeo ? '#000000' : 'var(--color-text-accent)') : 'var(--color-text-secondary)',
          cursor: canCreate ? 'pointer' : 'not-allowed', fontSize: 'var(--text-lg)', fontWeight: 700,
          padding: 'var(--space-md) var(--space-xl)', letterSpacing: '0.05em',
          boxShadow: canCreate && isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : (canCreate ? '0 0 16px rgba(196, 163, 90, 0.15)' : 'none')
        }}>
        {tc('play_solo')}
      </button>
    </main>
  )
}
