import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ScoreTable } from '../components/ScoreTable'
import { useTheme } from '../lib/theme'
import { useGameStore } from '../store/gameStore'

export function ResultsScreen() {
  const { t } = useTranslation('results')
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const scores = useGameStore((s) => s.scores)
  const disconnect = useGameStore((s) => s.disconnect)

  // T14: Win celebration — confetti burst
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.width = canvas.offsetWidth * dpr
    const h = canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const colors = Object.values(theme.colorPalette)
    const particles = Array.from({ length: theme.animationPreset.celebrate.particleCount }, () => ({
      x: w / 2 / dpr,
      y: h / 2 / dpr,
      vx: (Math.random() - 0.5) * theme.animationPreset.celebrate.spread,
      vy: (Math.random() - 1) * theme.animationPreset.celebrate.spread,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }))

    const duration = theme.animationPreset.celebrate.duration * 1000
    const start = performance.now()

    function frame(now: number) {
      if (!ctx) return
      const elapsed = now - start
      const progress = elapsed / duration
      if (progress >= 1) return
      ctx.clearRect(0, 0, w / dpr, h / dpr)
      for (const p of particles) {
        p.x += p.vx * 0.1
        p.y += p.vy * 0.1
        p.vy += 0.5 // gravity
        p.life = 1 - progress
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color || '#ffffff'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [theme])

  if (!scores || scores.length === 0) {
    return (
      <main data-testid="results-screen" style={{ background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {t('tied')}
      </main>
    )
  }

  const maxCombined = Math.max(...scores.map((s) => s.combined))
  const winners = scores.filter((s) => s.combined === maxCombined)
  const winnerText = winners.map((w) => w.name).join(', ')

  return (
    <main data-testid="results-screen" style={{ alignItems: 'center', background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', minHeight: '100vh', padding: 'var(--space-xl)', position: 'relative' }}>
      {/* T14: Celebration canvas overlay */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />

      <h1 data-testid="results-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', margin: 0 }}>{t('winner')}</h1>

      <div data-testid="results-winner-name" style={{ color: 'var(--color-text-accent)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
        {winners.length === scores.length ? t('tied') : winnerText}
      </div>

      <div style={{ maxWidth: 480, width: '100%' }}>
        <ScoreTable scores={scores} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <button type="button" data-testid="btn-play-again" onClick={() => navigate('/')} style={{
          background: isNeo ? '#ffe66d' : 'var(--color-text-accent)',
          border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : 'none',
          borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-lg)',
          color: isNeo ? '#000000' : 'var(--color-surface-bg)',
          cursor: 'pointer',
          fontSize: 'var(--text-base)',
          fontWeight: 700,
          padding: 'var(--space-md) var(--space-xl)',
          boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : undefined,
        }}>
          {t('play_again')}
        </button>
        <button type="button" data-testid="btn-new-room" onClick={() => { disconnect(); navigate('/') }} style={{
          background: 'var(--color-surface-panel)',
          border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : 'none',
          borderRadius: isNeo ? `${neoRadius}px` : 'var(--radius-lg)',
          color: isNeo ? '#000000' : 'var(--color-text-primary)',
          cursor: 'pointer',
          fontSize: 'var(--text-base)',
          padding: 'var(--space-md) var(--space-xl)',
          boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : undefined,
        }}>
          {t('new_room')}
        </button>
      </div>
    </main>
  )
}
