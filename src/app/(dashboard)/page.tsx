'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, RefreshCw, ChevronRight, Phone, Calendar, Clock, Users, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLeads, useReps } from '@/hooks/useLeads'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ScorePill } from '@/components/common/ScorePill'
import { SkeletonTable } from '@/components/common/LoadingSkeleton'
import { formatDuration, formatDate, getInitials, getAvatarGradient } from '@/lib/utils'

type StatusFilter = '' | 'NOT_REVIEWED' | 'AI_READY' | 'REVIEWED'

const STATUS_OPTIONS = [
  { value: '' as StatusFilter, label: 'All' },
  { value: 'NOT_REVIEWED' as StatusFilter, label: 'Not Reviewed' },
  { value: 'AI_READY' as StatusFilter, label: 'AI Ready' },
  { value: 'REVIEWED' as StatusFilter, label: 'Reviewed' },
]

export default function LeadsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [repId, setRepId] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [scoreFilter, setScoreFilter] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    if (searchTimeout) clearTimeout(searchTimeout)
    const t = setTimeout(() => setDebouncedSearch(val), 300)
    setSearchTimeout(t)
  }, [searchTimeout])

  const scoreRange = useMemo(() => {
    if (!scoreFilter) return { scoreMin: null, scoreMax: null }
    if (scoreFilter === 'high') return { scoreMin: 70, scoreMax: null }
    if (scoreFilter === 'medium') return { scoreMin: 50, scoreMax: 69 }
    if (scoreFilter === 'low') return { scoreMin: null, scoreMax: 49 }
    return { scoreMin: null, scoreMax: null }
  }, [scoreFilter])

  const { data: leads, isLoading, refetch } = useLeads({
    search: debouncedSearch,
    repId,
    status,
    ...scoreRange,
  })

  const { data: reps } = useReps()

  const inputStyle = {
    background: '#f8fafc',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8,
    color: '#0f172a',
    fontSize: 13,
    padding: '8px 12px',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Leads
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, marginTop: 1 }}>
              Sales call quality reviews
            </p>
          </div>
          {!isLoading && leads && (
            <span style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc', fontSize: 12, fontWeight: 600,
              padding: '2px 8px', borderRadius: 20,
            }}>
              {leads.length} leads
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => refetch()}
            style={{
              ...inputStyle, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', color: '#475569',
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <div style={{ position: 'relative' }}>
            <button
              disabled
              title="Connect Bitrix24 to enable sync"
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#6366f1', fontSize: 13, fontWeight: 500,
                cursor: 'not-allowed', opacity: 0.6,
              }}
            >
              Sync from Bitrix24
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: 220, maxWidth: 320 }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search leads or reps..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: 32, boxSizing: 'border-box' }}
          />
        </div>

        {/* Rep filter */}
        <select
          value={repId}
          onChange={(e) => setRepId(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', minWidth: 150 }}
        >
          <option value="">All Reps</option>
          {(reps || []).map((rep: any) => (
            <option key={rep.id} value={rep.id}>{rep.name}</option>
          ))}
        </select>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 3 }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: status === opt.value ? '#6366f1' : 'transparent',
                color: status === opt.value ? 'white' : '#94a3b8',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Score filter */}
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', minWidth: 130 }}
        >
          <option value="">All Scores</option>
          <option value="high">High (≥70%)</option>
          <option value="medium">Medium (50-69%)</option>
          <option value="low">Low (&lt;50%)</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.5fr 1.5fr 130px 110px 40px',
          padding: '10px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: 'rgba(0,0,0,0.02)',
        }}>
          {['Lead', 'Rep', 'Call Date', 'Status', 'Score', ''].map((h, i) => (
            <span key={i} style={{
              fontSize: 11, fontWeight: 600, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ padding: '8px 20px 4px' }}>
            <SkeletonTable rows={8} cols={6} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!leads || leads.length === 0) && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ color: '#64748b', fontSize: 14 }}>No leads found matching your filters.</p>
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); setRepId(''); setStatus(''); setScoreFilter('') }}
              style={{ marginTop: 12, padding: '6px 16px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: 13, cursor: 'pointer' }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Rows */}
        {!isLoading && leads && leads.length > 0 && (
          <AnimatePresence>
            {leads.map((lead: any, i: number) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => router.push(`/leads/${lead.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1.5fr 130px 110px 40px',
                  padding: '13px 20px',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                className="lead-row"
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
              >
                {/* Lead */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: getAvatarGradient(lead.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: 'white',
                  }}>
                    {getInitials(lead.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{lead.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Phone size={10} color="#64748b" />
                      <span style={{ fontSize: 11, color: '#64748b' }}>{lead.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Rep */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: getAvatarGradient(lead.rep?.name || ''),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'white',
                  }}>
                    {getInitials(lead.rep?.name || '?')}
                  </div>
                  <span style={{ fontSize: 13, color: '#475569' }}>{lead.rep?.name}</span>
                </div>

                {/* Date */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={11} color="#64748b" />
                    <span style={{ fontSize: 13, color: '#475569' }}>
                      {formatDate(lead.callDate)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <Clock size={11} color="#64748b" />
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {formatDuration(lead.callDuration)}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={lead.status} />
                </div>

                {/* Score */}
                <div>
                  <ScorePill score={lead.latestScore} />
                  {lead.latestChecklistName && (
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.latestChecklistName}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ChevronRight size={16} color="#64748b" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {!isLoading && leads && leads.length > 0 && (
        <div style={{ marginTop: 12, padding: '0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Showing {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '2px 8px', color: '#f59e0b' }}>
            Demo data — connect Bitrix24 to sync real leads
          </span>
        </div>
      )}
    </div>
  )
}
