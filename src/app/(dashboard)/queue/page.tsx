'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, ChevronRight, Phone, Calendar, Clock, ArrowRight } from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { useReps } from '@/hooks/useLeads'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ScorePill } from '@/components/common/ScorePill'
import { SkeletonTable } from '@/components/common/LoadingSkeleton'
import { formatDuration, formatDate, getInitials, getAvatarGradient } from '@/lib/utils'
import { useLocale } from '@/hooks/useLocale'

type QueueMode = 'pending' | 'ai_ready'

export default function QueuePage() {
  const router = useRouter()
  const { t } = useLocale()
  const [mode, setMode] = useState<QueueMode>('pending')
  const [repId, setRepId] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)

  const status = mode === 'pending' ? 'NOT_REVIEWED' : 'AI_READY'

  const { data: leads, isLoading, refetch } = useLeads({ status, repId })
  const { data: reps } = useReps()

  const queue = useMemo(() => leads ?? [], [leads])
  const currentLead = queue[currentIdx] ?? null
  const remaining = queue.length - currentIdx

  const goToLead = (leadId: string) => router.push(`/leads/${leadId}`)

  const next = () => {
    if (currentIdx < queue.length - 1) setCurrentIdx((i) => i + 1)
  }

  const prev = () => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1)
  }

  const inputStyle: React.CSSProperties = {
    background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8, color: '#0f172a', fontSize: 13,
    padding: '7px 12px', outline: 'none',
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
            <Inbox size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Review Queue
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, marginTop: 1 }}>
              {isLoading ? '…' : `${queue.length} call${queue.length !== 1 ? 's' : ''} awaiting review`}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 0, background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 3 }}>
            {([
              { key: 'pending', label: 'Not Reviewed' },
              { key: 'ai_ready', label: 'AI Ready' },
            ] as { key: QueueMode; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setMode(key); setCurrentIdx(0) }}
                style={{
                  padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  background: mode === key ? '#6366f1' : 'transparent',
                  color: mode === key ? 'white' : '#94a3b8',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Rep filter */}
          <select
            value={repId}
            onChange={(e) => { setRepId(e.target.value); setCurrentIdx(0) }}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">All Reps</option>
            {(reps || []).map((rep: any) => (
              <option key={rep.id} value={rep.id}>{rep.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress bar */}
      {!isLoading && queue.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Reviewing {currentIdx + 1} of {queue.length}
            </span>
            <span style={{ fontSize: 12, color: currentIdx > 0 ? '#10b981' : '#64748b' }}>
              {currentIdx} reviewed this session
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4, transition: 'width 0.3s ease',
              background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
              width: `${queue.length > 0 ? ((currentIdx + 1) / queue.length) * 100 : 0}%`,
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Main: current lead card */}
        <div>
          {isLoading ? (
            <SkeletonTable rows={3} cols={4} />
          ) : queue.length === 0 ? (
            <div style={{
              background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 12, padding: '60px 32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Queue is empty!
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                {mode === 'pending' ? 'No unreviewed calls.' : 'No AI-ready calls to review.'} Great work!
              </p>
              <button
                onClick={() => router.push('/')}
                style={{
                  padding: '8px 20px', borderRadius: 8, background: '#6366f1',
                  color: 'white', border: 'none', fontSize: 13, cursor: 'pointer',
                }}
              >
                Back to Leads
              </button>
            </div>
          ) : currentLead ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLead.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{
                  background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 12, overflow: 'hidden',
                }}>
                  {/* Card header */}
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                      background: getAvatarGradient(currentLead.name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: 'white',
                    }}>
                      {getInitials(currentLead.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                        {currentLead.name}
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                          <Phone size={11} /> {currentLead.phone}
                        </span>
                        {currentLead.latestCallDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                            <Calendar size={11} /> {formatDate(currentLead.latestCallDate)}
                          </span>
                        )}
                        {currentLead.totalDuration > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                            <Clock size={11} /> {formatDuration(currentLead.totalDuration)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <StatusBadge status={currentLead.status} />
                      <ScorePill score={currentLead.latestScore} />
                    </div>
                  </div>

                  {/* Rep info */}
                  {currentLead.rep && (
                    <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: getAvatarGradient(currentLead.rep.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: 'white',
                      }}>
                        {getInitials(currentLead.rep.name)}
                      </div>
                      <span style={{ fontSize: 13, color: '#475569' }}>
                        Sales Rep: <strong>{currentLead.rep.name}</strong>
                      </span>
                    </div>
                  )}

                  {/* CTA */}
                  <div style={{ padding: '16px 24px', display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => goToLead(currentLead.id)}
                      style={{
                        flex: 1, padding: '11px 0', borderRadius: 9, fontSize: 14, fontWeight: 600,
                        background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      Review This Call <ArrowRight size={15} />
                    </button>
                    {currentIdx < queue.length - 1 && (
                      <button
                        onClick={next}
                        style={{
                          padding: '11px 20px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                          background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)',
                          color: '#475569', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        Skip <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>

        {/* Right: queue list */}
        <div style={{
          background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 12, overflow: 'hidden', maxHeight: '70vh', overflowY: 'auto',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Up Next ({remaining} remaining)
          </div>
          {isLoading ? (
            <div style={{ padding: 16 }}><SkeletonTable rows={4} cols={2} /></div>
          ) : (
            queue.map((lead: any, i: number) => (
              <div
                key={lead.id}
                onClick={() => setCurrentIdx(i)}
                style={{
                  padding: '10px 16px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  background: i === currentIdx ? 'rgba(99,102,241,0.08)' : i < currentIdx ? 'rgba(16,185,129,0.04)' : 'transparent',
                  borderLeft: i === currentIdx ? '3px solid #6366f1' : '3px solid transparent',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: getAvatarGradient(lead.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: 'white',
                    opacity: i < currentIdx ? 0.5 : 1,
                  }}>
                    {getInitials(lead.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: i < currentIdx ? '#94a3b8' : '#0f172a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {i < currentIdx && '✓ '}{lead.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      {lead.rep?.name}
                    </div>
                  </div>
                  {lead.latestScore != null && <ScorePill score={lead.latestScore} />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
