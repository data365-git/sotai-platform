'use client'

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Save, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react'
import { ScoreRing } from '@/components/common/ScoreRing'
import { VerdictBadge } from '@/components/common/VerdictBadge'
import { useReview } from '@/hooks/useReview'

type VerdictType = 'pass' | 'fail' | 'unclear'

interface VerdictItem {
  verdict: VerdictType
  reasoning: string
  manualOverride: boolean
}

interface ChecklistItem {
  id: string
  text: string
  type: string
  weight: number
  order: number
}

interface Checklist {
  id: string
  name: string
  items: ChecklistItem[]
}

interface Review {
  id?: string
  checklistId: string
  verdicts: Record<string, VerdictItem>
  score: number
  summary?: string | null
  isLocked?: boolean
  checklist: Checklist
}

interface ReviewPanelProps {
  review: Review | null | undefined
  allChecklists: Checklist[]
  leadId: string
  onChecklistChange?: (checklistId: string) => void
}

function calcScore(verdicts: Record<string, { verdict: string }>, items: ChecklistItem[]): number {
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

function ItemRow({
  item,
  verdict,
  onChange,
  isLocked,
}: {
  item: ChecklistItem
  verdict?: VerdictItem
  onChange: (id: string, v: Partial<VerdictItem>) => void
  isLocked: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: 'rgba(0,0,0,0.02)',
      border: '1px solid rgba(0,0,0,0.06)',
      borderRadius: 8, marginBottom: 6, overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, flexShrink: 0, width: 22 }}>
          {item.order}
        </span>
        <span style={{ flex: 1, fontSize: 12.5, color: '#334155', lineHeight: 1.4 }}>
          {item.text}
        </span>
        <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>
          ×{item.weight}
        </span>
        {verdict && (
          <VerdictBadge verdict={verdict.verdict} />
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, flexShrink: 0 }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {/* Verdict buttons */}
          {!isLocked && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 8 }}>
              {(['pass', 'fail', 'unclear'] as VerdictType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => onChange(item.id, { verdict: v, manualOverride: true })}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: verdict?.verdict === v
                      ? v === 'pass' ? 'rgba(16,185,129,0.15)' : v === 'fail' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'
                      : 'rgba(0,0,0,0.04)',
                    border: verdict?.verdict === v
                      ? v === 'pass' ? '1px solid rgba(16,185,129,0.4)' : v === 'fail' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(245,158,11,0.4)'
                      : '1px solid rgba(0,0,0,0.08)',
                    color: verdict?.verdict === v
                      ? v === 'pass' ? '#059669' : v === 'fail' ? '#dc2626' : '#d97706'
                      : '#64748b',
                  }}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Reasoning */}
          {verdict?.reasoning && (
            <div style={{
              fontSize: 12, color: '#475569', padding: '8px 10px',
              background: 'rgba(99,102,241,0.04)', borderRadius: 6,
              borderLeft: '2px solid rgba(99,102,241,0.3)',
              lineHeight: 1.5,
            }}>
              {verdict.reasoning}
            </div>
          )}

          {/* Manual override indicator */}
          {verdict?.manualOverride && (
            <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>
              ✎ Manual override
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ReviewPanel({ review, allChecklists, leadId, onChecklistChange }: ReviewPanelProps) {
  const [selectedChecklistId, setSelectedChecklistId] = useState(
    review?.checklistId || allChecklists[0]?.id || ''
  )
  const [verdicts, setVerdicts] = useState<Record<string, VerdictItem>>(
    (review?.verdicts as Record<string, VerdictItem>) || {}
  )
  const [summary, setSummary] = useState(review?.summary || '')
  const [isLocked, setIsLocked] = useState(review?.isLocked || false)

  const reviewMutation = useReview()

  const selectedChecklist = useMemo(
    () => allChecklists.find((c) => c.id === selectedChecklistId),
    [allChecklists, selectedChecklistId]
  )

  const computedScore = useMemo(() => {
    if (!selectedChecklist) return 0
    return calcScore(verdicts, selectedChecklist.items)
  }, [verdicts, selectedChecklist])

  const handleVerdictChange = useCallback((id: string, updates: Partial<VerdictItem>) => {
    setVerdicts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { verdict: 'unclear', reasoning: '', manualOverride: false }), ...updates },
    }))
  }, [])

  const handleChecklistChange = (id: string) => {
    setSelectedChecklistId(id)
    onChecklistChange?.(id)
    // Find review for this checklist
    const r = review?.checklistId === id ? review : null
    setVerdicts((r?.verdicts as Record<string, VerdictItem>) || {})
    setSummary(r?.summary || '')
    setIsLocked(r?.isLocked || false)
  }

  const handleSave = async (lock: boolean) => {
    if (!selectedChecklistId) {
      toast.error('Please select a checklist')
      return
    }
    try {
      await reviewMutation.mutateAsync({
        leadId, checklistId: selectedChecklistId,
        verdicts, summary: summary || undefined, isLocked: lock,
      })
      setIsLocked(lock)
      toast.success(lock ? 'Review locked and saved!' : 'Draft saved successfully')
    } catch {
      toast.error('Failed to save review')
    }
  }

  const items = selectedChecklist?.items || []
  const passCount = items.filter((it) => verdicts[it.id]?.verdict === 'pass').length
  const failCount = items.filter((it) => verdicts[it.id]?.verdict === 'fail').length
  const unclearCount = items.filter((it) => verdicts[it.id]?.verdict === 'unclear').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Score ring + stats */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ScoreRing score={computedScore} size={80} strokeWidth={7} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
              Quality Score
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>{passCount}</span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>Pass</span>
              </div>
              <div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#f87171' }}>{failCount}</span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>Fail</span>
              </div>
              <div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>{unclearCount}</span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>Unclear</span>
              </div>
            </div>
          </div>
          {isLocked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Lock size={11} color="#34d399" />
              <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>Reviewed</span>
            </div>
          )}
        </div>
      </div>

      {/* Checklist selector */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Checklist
        </div>
        <select
          value={selectedChecklistId}
          onChange={(e) => handleChecklistChange(e.target.value)}
          disabled={isLocked}
          style={{
            width: '100%', background: '#f8fafc',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 8, color: '#0f172a', fontSize: 13,
            padding: '7px 10px', outline: 'none',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked ? 0.7 : 1,
          }}
        >
          {allChecklists.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Criteria ({items.length})
        </div>
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            verdict={verdicts[item.id]}
            onChange={handleVerdictChange}
            isLocked={isLocked}
          />
        ))}

        {/* Summary */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Summary / Feedback
          </div>
          <textarea
            value={summary || ''}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isLocked}
            placeholder="Write a summary of this call review..."
            rows={4}
            style={{
              width: '100%', background: '#f8fafc',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 8, color: '#0f172a', fontSize: 13,
              padding: '10px 12px', outline: 'none', resize: 'vertical',
              lineHeight: 1.5, boxSizing: 'border-box',
              opacity: isLocked ? 0.7 : 1,
              cursor: isLocked ? 'not-allowed' : 'text',
            }}
          />
        </div>
      </div>

      {/* Actions */}
      {!isLocked && (
        <div style={{
          padding: '12px 20px 20px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', gap: 8,
        }}>
          <button
            onClick={() => handleSave(false)}
            disabled={reviewMutation.isPending}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.1)',
              color: '#475569', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={reviewMutation.isPending}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: '#6366f1',
              border: '1px solid rgba(99,102,241,0.5)',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: reviewMutation.isPending ? 0.7 : 1,
            }}
          >
            <Lock size={14} />
            {reviewMutation.isPending ? 'Saving...' : 'Lock & Review'}
          </button>
        </div>
      )}

      {isLocked && (
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setIsLocked(false)}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.1)',
              color: '#475569', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Unlock size={14} />
            Unlock to Edit
          </button>
        </div>
      )}
    </div>
  )
}
