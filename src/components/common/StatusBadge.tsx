'use client'

type LeadStatus = 'NOT_REVIEWED' | 'AI_READY' | 'REVIEWED'

interface StatusBadgeProps {
  status: LeadStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = {
    NOT_REVIEWED: {
      label: 'Not Reviewed',
      bg: 'rgba(100,116,139,0.15)',
      border: 'rgba(100,116,139,0.3)',
      color: '#94a3b8',
      dotColor: '#64748b',
      pulse: false,
    },
    AI_READY: {
      label: 'AI Ready',
      bg: 'rgba(99,102,241,0.15)',
      border: 'rgba(99,102,241,0.35)',
      color: '#a5b4fc',
      dotColor: '#6366f1',
      pulse: true,
    },
    REVIEWED: {
      label: 'Reviewed',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.3)',
      color: '#34d399',
      dotColor: '#10b981',
      pulse: false,
    },
  }

  const c = config[status] || config.NOT_REVIEWED
  const px = size === 'sm' ? '6px 8px' : '4px 10px'
  const fontSize = size === 'sm' ? 11 : 12

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: px,
        borderRadius: 20,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        fontSize,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}
    >
      {status === 'REVIEWED' ? (
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke={c.dotColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: c.dotColor,
            display: 'inline-block',
            flexShrink: 0,
            animation: c.pulse ? 'pulse 2s ease-in-out infinite' : undefined,
          }}
        />
      )}
      {c.label}
    </span>
  )
}
