'use client'

import { useEffect, useMemo, useRef } from 'react'
import { formatTimestamp } from '@/lib/utils'

interface TranscriptLine {
  timestamp: number
  speaker: string
  speakerRole: 'rep' | 'lead'
  text: string
}

interface TranscriptPanelProps {
  lines: TranscriptLine[]
  currentTime: number
  onSeek: (t: number) => void
}

export function TranscriptPanel({ lines, currentTime, onSeek }: TranscriptPanelProps) {
  const activeIndex = useMemo(() => {
    if (!lines.length || currentTime <= 0) return 0
    let idx = 0
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].timestamp <= currentTime) {
        idx = i
        break
      }
    }
    return idx
  }, [lines, currentTime])

  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentTime > 0) {
      activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeIndex, currentTime])

  if (!lines || !lines.length) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
        <p style={{ color: '#64748b', fontSize: 13 }}>No transcript available for this call.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {lines.map((line, i) => {
        const isActive = i === activeIndex && currentTime > 0
        const isRep = line.speakerRole === 'rep'
        return (
          <div
            key={i}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSeek(line.timestamp)}
            style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
              borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
              background: isActive ? 'rgba(99,102,241,0.07)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onSeek(line.timestamp) }}
              style={{
                fontSize: 10, padding: '2px 5px', borderRadius: 4, flexShrink: 0, marginTop: 2,
                background: 'rgba(99,102,241,0.06)',
                color: '#6366f1', fontFamily: 'monospace',
                cursor: 'pointer', border: '1px solid rgba(99,102,241,0.2)',
                lineHeight: 1.4,
              }}
            >
              {formatTimestamp(line.timestamp)}
            </button>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 4, flexShrink: 0, marginTop: 2,
              background: isRep ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.06)',
              color: isRep ? '#6366f1' : '#64748b', fontWeight: 600,
              lineHeight: 1.4,
            }}>
              {isRep ? 'Rep' : 'Lead'}
            </span>
            <span style={{
              fontSize: 13, color: isActive ? '#0f172a' : '#475569',
              lineHeight: 1.55, flex: 1,
              transition: 'color 0.15s',
            }}>
              {line.text}
            </span>
          </div>
        )
      })}
    </div>
  )
}
