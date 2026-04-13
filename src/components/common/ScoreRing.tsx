'use client'

import { useEffect, useRef } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

function getColor(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

export function ScoreRing({ score, size = 72, strokeWidth = 6, showLabel = true }: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const color = getColor(score)
  const offset = circumference - (score / 100) * circumference

  useEffect(() => {
    const el = circleRef.current
    if (!el) return
    el.style.strokeDashoffset = String(circumference)
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1s ease-out'
      el.style.strokeDashoffset = String(offset)
    })
    return () => cancelAnimationFrame(raf)
  }, [score, circumference, offset])

  const center = size / 2
  const fontSize = size < 60 ? size * 0.22 : size * 0.2
  const suffixSize = fontSize * 0.65

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        ref={circleRef}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      {showLabel && (
        <>
          <text
            x={center}
            y={center + fontSize * 0.35}
            textAnchor="middle"
            fill={color}
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="var(--font-geist-sans, system-ui, sans-serif)"
          >
            {Math.round(score)}
          </text>
          <text
            x={center + fontSize * 0.5 + 1}
            y={center + fontSize * 0.35}
            textAnchor="start"
            fill={color}
            fontSize={suffixSize}
            fontWeight="500"
            fontFamily="var(--font-geist-sans, system-ui, sans-serif)"
            opacity="0.8"
          >
            %
          </text>
        </>
      )}
    </svg>
  )
}
