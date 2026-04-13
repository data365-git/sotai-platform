import type { LeadStatus } from '@prisma/client'

export const NAV_ITEMS = [
  { href: '/', label: 'Leads', icon: 'Phone' },
  { href: '/checklists', label: 'Checklists', icon: 'CheckSquare' },
  { href: '/analytics', label: 'Analytics', icon: 'BarChart3' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
] as const

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NOT_REVIEWED: 'Not Reviewed',
  AI_READY: 'AI Ready',
  REVIEWED: 'Reviewed',
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  NOT_REVIEWED: 'bg-slate-100 text-slate-500 border-slate-300',
  AI_READY: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  REVIEWED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
}

export const STATUS_DOT_COLORS: Record<LeadStatus, string> = {
  NOT_REVIEWED: 'bg-slate-400/60',
  AI_READY: 'bg-indigo-400',
  REVIEWED: 'bg-emerald-400',
}

export const SCORE_PASS_THRESHOLD = 70
export const DEMO_AUDIO_URL = '/demo-call.wav'

export const REP_AVATAR_COLORS = [
  '#6366f1',
  '#7c3aed',
  '#06b6d4',
  '#ec4899',
  '#f59e0b',
  '#14b8a6',
]
