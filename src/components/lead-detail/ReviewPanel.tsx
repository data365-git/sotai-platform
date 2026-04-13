'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react'
import { ScoreRing } from '@/components/common/ScoreRing'
import { VerdictBadge } from '@/components/common/VerdictBadge'
import { useReview } from '@/hooks/useReview'
import { useLocale } from '@/hooks/useLocale'

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
  reviews: Review[]
  allChecklists: Checklist[]
  recordingId: string
  leadId: string
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
  const { t } = useLocale()
  const verdictLabels: Record<string, string> = { pass: t.review.pass, fail: t.review.fail, unclear: t.review.unclear }

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
        {verdict && <VerdictBadge verdict={verdict.verdict} />}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, flexShrink: 0 }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
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
                  {verdictLabels[v]}
                </button>
              ))}
            </div>
          )}
          {verdict?.reasoning && (
            <div style={{
              fontSize: 12, color: '#475569', padding: '8px 10px',
              background: 'rgba(99,102,241,0.04)', borderRadius: 6,
              borderLeft: '2px solid rgba(99,102,241,0.3)', lineHeight: 1.5,
            }}>
              {verdict.reasoning}
            </div>
          )}
          {verdict?.manualOverride && (
            <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>✎ {t.review.manualOverride}</div>
          )}
        </div>
      )}
    </div>
  )
}

export function ReviewPanel({ reviews, allChecklists, recordingId, leadId }: ReviewPanelProps) {
  const { t } = useLocale()
  const defaultChecklist = allChecklists[0]
  const defaultReview = reviews[0] ?? null

  const [selectedChecklistId, setSelectedChecklistId] = useState(
    defaultReview?.checklistId ?? defaultChecklist?.id ?? ''
  )

  const activeReview = useMemo(
    () => reviews.find((r) => r.checklistId === selectedChecklistId) ?? null,
    [reviews, selectedChecklistId]
  )

  const [verdicts, setVerdicts] = useState<Record<string, VerdictItem>>(
    (activeReview?.verdicts as Record<string, VerdictItem>) ?? {}
  )
  const [summary, setSummary] = useState(activeReview?.summary ?? '')
  const [isLocked, setIsLocked] = useState(activeReview?.isLocked ?? false)

  // Sync state when recording changes or review loads
  useEffect(() => {
    setSelectedChecklistId(defaultReview?.checklistId ?? defaultChecklist?.id ?? '')
  }, [recordingId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setVerdicts((activeReview?.verdicts as Record<string, VerdictItem>) ?? {})
    setSummary(activeReview?.summary ?? '')
    setIsLocked(activeReview?.isLocked ?? false)
  }, [activeReview])

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
      [id]: { ...(prev[id] ?? { verdict: 'unclear', reasoning: '', manualOverride: false }), ...updates },
    }))
  }, [])

  const handleChecklistChange = (id: string) => {
    setSelectedChecklistId(id)
    const r = reviews.find((rev) => rev.checklistId === id) ?? null
    setVerdicts((r?.verdicts as Record<string, VerdictItem>) ?? {})
    setSummary(r?.summary ?? '')
    setIsLocked(r?.isLocked ?? false)
  }

  const handleSave = async (lock: boolean) => {
    if (!selectedChecklistId || !recordingId) {
      toast.error(t.review.noChecklist)
      return
    }
    try {
      await reviewMutation.mutateAsync({
        recordingId, leadId, checklistId: selectedChecklistId,
        verdicts, summary: summary || undefined, isLocked: lock,
      })
      setIsLocked(lock)
      toast.success(lock ? t.review.lockSuccess : t.review.draftSaved)
    } catch {
      toast.error(t.review.saveError)
    }
  }

  const items = selectedChecklist?.items ?? []
  const passCount = items.filter((it) => verdicts[it.id]?.verdict === 'pass').length
  const failCount = items.filter((it) => verdicts[it.id]?.verdict === 'fail').length
  const unclearCount = items.filter((it) => verdicts[it.id]?.verdict === 'unclear').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Score ring */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ScoreRing score={computedScore} size={80} strokeWidth={7} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>{t.review.qualityScore}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>{passCount}</span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>{t.review.pass}</span>
              </div>
              <div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#f87171' }}>{failCount}</span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>{t.review.fail}</span>
              </div>
              <div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>{unclearCount}</span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>{t.review.unclear}</span>
              </div>
            </div>
          </div>
          {isLocked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Lock size={11} color="#34d399" />
              <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>{t.review.reviewed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Checklist selector */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          {t.review.checklist}
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
            <option key={c.id} value={c.id}>
              {c.name}{reviews.find((r) => r.checklistId === c.id) ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          {t.review.criteria} ({items.length})
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
            {t.review.summaryLabel}
          </div>
          <textarea
            value={summary ?? ''}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isLocked}
            placeholder={t.review.summaryPlaceholder}
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
      {!isLocked ? (
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleSave(false)}
            disabled={reviewMutation.isPending}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)',
              color: '#475569', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Save size={14} />{t.review.saveDraft}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={reviewMutation.isPending}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: '#6366f1', border: '1px solid rgba(99,102,241,0.5)',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: reviewMutation.isPending ? 0.7 : 1,
            }}
          >
            <Lock size={14} />{reviewMutation.isPending ? t.review.saving : t.review.lockReview}
          </button>
        </div>
      ) : (
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setIsLocked(false)}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
              color: '#475569', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Unlock size={14} />{t.review.unlock}
          </button>
        </div>
      )}
    </div>
  )
}
