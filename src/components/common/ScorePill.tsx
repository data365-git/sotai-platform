'use client'

interface ScorePillProps {
  score: number | null | undefined
  size?: 'sm' | 'md' | 'lg'
}

export function ScorePill({ score, size = 'md' }: ScorePillProps) {
  if (score === null || score === undefined) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        borderRadius: 20,
        background: 'rgba(100,116,139,0.12)',
        border: '1px solid rgba(100,116,139,0.2)',
        color: '#64748b',
        fontSize: size === 'sm' ? 11 : size === 'lg' ? 14 : 12,
        fontWeight: 500,
      }}>—</span>
    )
  }

  let bg: string, border: string, color: string
  if (score >= 70) {
    bg = 'rgba(16,185,129,0.12)'
    border = 'rgba(16,185,129,0.3)'
    color = '#34d399'
  } else if (score >= 50) {
    bg = 'rgba(245,158,11,0.12)'
    border = 'rgba(245,158,11,0.3)'
    color = '#fbbf24'
  } else {
    bg = 'rgba(239,68,68,0.12)'
    border = 'rgba(239,68,68,0.3)'
    color = '#f87171'
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: size === 'sm' ? '2px 8px' : '3px 10px',
      borderRadius: 20,
      background: bg,
      border: `1px solid ${border}`,
      color,
      fontSize: size === 'sm' ? 11 : size === 'lg' ? 14 : 12,
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {Math.round(score)}%
    </span>
  )
}
