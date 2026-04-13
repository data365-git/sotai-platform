'use client'

type Verdict = 'pass' | 'fail' | 'unclear'

interface VerdictBadgeProps {
  verdict: Verdict
  size?: 'sm' | 'md'
}

export function VerdictBadge({ verdict, size = 'sm' }: VerdictBadgeProps) {
  const config = {
    pass: {
      label: 'Pass',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.3)',
      color: '#34d399',
      icon: (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    fail: {
      label: 'Fail',
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.3)',
      color: '#f87171',
      icon: (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M3 3l4 4M7 3l-4 4" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    unclear: {
      label: 'Unclear',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.3)',
      color: '#fbbf24',
      icon: (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M5 3v3M5 7.5v0.5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  }

  const c = config[verdict]
  const fontSize = size === 'sm' ? 11 : 12

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, fontSize, fontWeight: 500,
    }}>
      {c.icon}
      {c.label}
    </span>
  )
}
