import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Score } from '@town77/shared-types'
import { scorePopTransition } from '../lib/motion'
import { useTheme } from '../lib/theme'

interface ScoreTableProps {
  scores: Score[]
}

export function ScoreTable({ scores }: ScoreTableProps) {
  const { t } = useTranslation('results')
  const { theme } = useTheme()
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;
  const maxCombined = Math.max(...scores.map((s) => s.combined))
  const scorePop = scorePopTransition(theme.animationPreset)

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
    fontVariantNumeric: 'tabular-nums' as const,
    borderBottom: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : undefined,
  }

  const neoHeaderStyle = isNeo ? {
    ...headerStyle,
    borderBottom: `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`,
  } : headerStyle;

  return (
    <table
      data-testid="score-table"
      style={{
        borderCollapse: 'collapse',
        color: 'var(--color-text-primary)',
        width: '100%',
        border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : undefined,
        borderRadius: isNeo ? `${neoRadius}px` : undefined,
      }}
    >
      <thead>
        <tr>
          <th style={neoHeaderStyle} />
          <th style={neoHeaderStyle}>{t('placed')}</th>
          <th style={neoHeaderStyle}>{t('remaining')}</th>
          <th style={neoHeaderStyle}>{t('total')}</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((score, index) => {
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
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ ...scorePop, delay: index * 0.05 }}
                >
                  {score.placed}
                </motion.span>
              </td>
              <td data-testid={`score-remaining-${score.playerId}`} style={cellStyle}>
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ ...scorePop, delay: index * 0.05 }}
                >
                  {score.remaining}
                </motion.span>
              </td>
              <td data-testid={`score-combined-${score.playerId}`} style={{ ...cellStyle, fontWeight: 700 }}>
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ ...scorePop, delay: index * 0.05 }}
                >
                  {score.combined}
                </motion.span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
