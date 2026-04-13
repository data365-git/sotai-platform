import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—'
  return `${Math.round(score)}%`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-slate-400'
  if (score < 50) return 'text-rose-400'
  if (score < 70) return 'text-amber-400'
  return 'text-emerald-400'
}

export function getScoreHex(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#64748b'
  if (score < 50) return '#fb7185'
  if (score < 70) return '#fbbf24'
  return '#34d399'
}

export function getScoreBg(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'bg-slate-700 text-slate-300'
  if (score < 50) return 'bg-rose-500/20 text-rose-300'
  if (score < 70) return 'bg-amber-500/20 text-amber-300'
  return 'bg-emerald-500/20 text-emerald-300'
}

export function generatePeaks(seed: number, count: number = 100): number[] {
  const peaks: number[] = []
  let s = seed
  for (let i = 0; i < count; i++) {
    // simple LCG random
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const v = ((s >>> 0) / 0xffffffff) * 2 - 1
    peaks.push(Math.round(v * 100) / 100)
  }
  return peaks
}

export function repColorClass(index: number): string {
  const colors = [
    'bg-indigo-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-amber-500',
    'bg-teal-500',
  ]
  return colors[index % colors.length]
}

export function repColorHex(index: number): string {
  const colors = ['#6366f1', '#7c3aed', '#06b6d4', '#ec4899', '#f59e0b', '#14b8a6']
  return colors[index % colors.length]
}

export function getAvatarGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  ]
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length
  return gradients[idx]
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getScoreColorHex(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

export function getScoreColorClass(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

export function calcScore(verdicts: Record<string, { verdict: string }>, items: { id: string; weight: number }[]): number {
  let total = 0, earned = 0
  for (const item of items) {
    const v = verdicts[item.id]
    if (!v) continue
    total += item.weight
    if (v.verdict === 'pass') earned += item.weight
    else if (v.verdict === 'unclear') earned += item.weight * 0.5
  }
  return total > 0 ? Math.round((earned / total) * 100) : 0
}
