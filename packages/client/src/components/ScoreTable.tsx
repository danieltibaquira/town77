import { useTranslation } from 'react-i18next'
import type { Score } from '@town77/shared-types'

interface ScoreTableProps {
  scores: Score[]
}

export function ScoreTable({ scores }: ScoreTableProps) {
  const { t } = useTranslation('results')
  const maxCombined = Math.max(...scores.map((s) => s.combined))

  const headerStyle = {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    padding: 'var(--space-xs) var(--space-sm)',
    textAlign: 'left' as const,
  }

  const cellStyle = {
    padding: 'var(--space-xs) var(--space-sm)',
    fontSize: 'var(--text-base)',
  }

  return (
    <table
      data-testid="score-table"
      style={{
        borderCollapse: 'collapse',
        color: 'var(--color-text-primary)',
        width: '100%',
      }}
    >
      <thead>
        <tr>
          <th style={headerStyle} />
          <th style={headerStyle}>{t('placed')}</th>
          <th style={headerStyle}>{t('remaining')}</th>
          <th style={headerStyle}>{t('total')}</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((score) => {
          const isWinner = score.combined === maxCombined
          return (
            <tr
              key={score.playerId}
              data-testid={`score-row-${score.playerId}`}
              data-winner={isWinner}
              style={{
                background: isWinner ? 'var(--color-surface-cell-valid)' : 'transparent',
              }}
            >
              <td style={{ ...cellStyle, fontWeight: isWinner ? 700 : 400 }}>
                <span>{score.name}</span>
                {isWinner ? ' 👑' : ''}
              </td>
              <td data-testid={`score-placed-${score.playerId}`} style={cellStyle}>
                {score.placed}
              </td>
              <td data-testid={`score-remaining-${score.playerId}`} style={cellStyle}>
                {score.remaining}
              </td>
              <td data-testid={`score-combined-${score.playerId}`} style={{ ...cellStyle, fontWeight: 700 }}>
                {score.combined}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
