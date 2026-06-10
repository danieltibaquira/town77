import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ScoreTable } from '../components/ScoreTable'
import { useGameStore } from '../store/gameStore'

export function ResultsScreen() {
  const { t } = useTranslation('results')
  const navigate = useNavigate()

  const scores = useGameStore((s) => s.scores)
  const disconnect = useGameStore((s) => s.disconnect)

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
    <main data-testid="results-screen" style={{ alignItems: 'center', background: 'var(--color-surface-bg)', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', minHeight: '100vh', padding: 'var(--space-xl)' }}>
      <h1 data-testid="results-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', margin: 0 }}>{t('winner')}</h1>

      <div data-testid="results-winner-name" style={{ color: 'var(--color-text-accent)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
        {winners.length === scores.length ? t('tied') : winnerText}
      </div>

      <div style={{ maxWidth: 480, width: '100%' }}>
        <ScoreTable scores={scores} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <button type="button" data-testid="btn-play-again" onClick={() => navigate('/')} style={{ background: 'var(--color-text-accent)', border: 'none', borderRadius: 'var(--radius-lg)', color: 'var(--color-surface-bg)', cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 700, padding: 'var(--space-md) var(--space-xl)' }}>
          {t('play_again')}
        </button>
        <button type="button" data-testid="btn-new-room" onClick={() => { disconnect(); navigate('/') }} style={{ background: 'var(--color-surface-cell)', border: 'none', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 'var(--text-base)', padding: 'var(--space-md) var(--space-xl)' }}>
          {t('new_room')}
        </button>
      </div>
    </main>
  )
}
