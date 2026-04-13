'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
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

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'rgba(245,158,11,0.35)', color: '#0f172a', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
      : part
  )
}

export function TranscriptPanel({ lines, currentTime, onSeek }: TranscriptPanelProps) {
  const [query, setQuery] = useState('')

  const activeIndex = useMemo(() => {
    if (!lines.length || currentTime <= 0) return 0
    let idx = 0
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].timestamp <= currentTime) { idx = i; break }
    }
    return idx
  }, [lines, currentTime])

  const filteredIndices = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return new Set(lines.reduce<number[]>((acc, l, i) => {
      if (l.text.toLowerCase().includes(q) || l.speaker.toLowerCase().includes(q)) acc.push(i)
      return acc
    }, []))
  }, [lines, query])

  const matchCount = filteredIndices?.size ?? 0

  const activeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (currentTime > 0) activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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
    <div>
      {/* Search bar */}
      <div style={{ padding: '8px 10px 6px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} color="#94a3b8" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 7, fontSize: 12, color: '#0f172a',
              padding: '6px 28px 6px 26px', outline: 'none',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        {query && (
          <div style={{ fontSize: 10, color: matchCount > 0 ? '#6366f1' : '#ef4444', marginTop: 4, paddingLeft: 2 }}>
            {matchCount > 0 ? `${matchCount} match${matchCount !== 1 ? 'es' : ''}` : 'No matches'}
          </div>
        )}
      </div>

      {/* Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 0 8px' }}>
        {lines.map((line, i) => {
          if (filteredIndices && !filteredIndices.has(i)) return null
          const isActive = i === activeIndex && currentTime > 0 && !query
          const isRep = line.speakerRole === 'rep'
          const isMatch = filteredIndices?.has(i)
          return (
            <div
              key={i}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSeek(line.timestamp)}
              style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                borderLeft: isActive ? '2px solid #6366f1' : isMatch ? '2px solid rgba(245,158,11,0.5)' : '2px solid transparent',
                background: isActive ? 'rgba(99,102,241,0.07)' : isMatch ? 'rgba(245,158,11,0.05)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onSeek(line.timestamp) }}
                style={{
                  fontSize: 10, padding: '2px 5px', borderRadius: 4, flexShrink: 0, marginTop: 2,
                  background: 'rgba(99,102,241,0.06)', color: '#6366f1', fontFamily: 'monospace',
                  cursor: 'pointer', border: '1px solid rgba(99,102,241,0.2)', lineHeight: 1.4,
                }}
              >
                {formatTimestamp(line.timestamp)}
              </button>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 4, flexShrink: 0, marginTop: 2,
                background: isRep ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.06)',
                color: isRep ? '#6366f1' : '#64748b', fontWeight: 600, lineHeight: 1.4,
              }}>
                {isRep ? 'Rep' : 'Lead'}
              </span>
              <span style={{
                fontSize: 13, color: isActive ? '#0f172a' : '#475569',
                lineHeight: 1.55, flex: 1, transition: 'color 0.15s',
              }}>
                {highlight(line.text, query)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
