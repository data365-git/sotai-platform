'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, AreaChart, Area, ReferenceLine, Cell,
} from 'recharts'
import { ArrowLeft, Phone, TrendingUp, CheckCircle, AlertCircle, Calendar, Clock } from 'lucide-react'
import { ScoreRing } from '@/components/common/ScoreRing'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { getInitials, getAvatarGradient, formatDate, formatDuration } from '@/lib/utils'

const COLORS = ['#6366f1', '#7c3aed', '#06b6d4', '#ec4899', '#f59e0b']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ color: '#475569', marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || '#475569', fontWeight: 600 }}>
          {p.name}: {Math.round(p.value)}{p.name?.toLowerCase().includes('score') ? '%' : ''}
        </div>
      ))}
    </div>
  )
}

function useRepAnalytics(repId: string) {
  return useQuery({
    queryKey: ['analytics', 'rep', repId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/rep/${repId}`)
      if (!res.ok) throw new Error('Failed to fetch rep analytics')
      return res.json()
    },
    enabled: !!repId,
  })
}

export default function RepAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const repId = params.id as string

  const { data, isLoading } = useRepAnalytics(repId)

  if (isLoading) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <LoadingSkeleton height={60} className="mb-6" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => <LoadingSkeleton key={i} height={110} />)}
        </div>
        <LoadingSkeleton height={280} className="mb-4" />
        <LoadingSkeleton height={280} />
      </div>
    )
  }

  if (!data) return null

  const { rep, kpis, scoreTrend, checklistBreakdown, failingItems, recentCalls } = data
  const filteredTrend = (scoreTrend || []).filter((d: any) => d.avgScore > 0)

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push('/analytics')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: '4px 0',
          }}
        >
          <ArrowLeft size={14} />
          Analytics
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: getAvatarGradient(rep.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'white',
          }}>
            {getInitials(rep.name)}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              {rep.name}
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, marginTop: 2 }}>
              {rep.email} · Sales Rep Performance
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <ScoreRing score={kpis.avgScore} size={72} strokeWidth={6} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard title="Total Calls" value={kpis.totalCalls} icon={<Phone size={18} />} color="#6366f1" subtitle="recordings" />
        <KPICard title="Reviewed" value={kpis.reviewedCalls} icon={<CheckCircle size={18} />} color="#10b981" subtitle="calls analyzed" />
        <KPICard title="Avg Score" value={kpis.avgScore} suffix="%" icon={<TrendingUp size={18} />} color="#7c3aed" subtitle="weighted" />
        <KPICard title="Pass Rate" value={kpis.passRate} suffix="%" icon={<CheckCircle size={18} />} color="#f59e0b" subtitle="scoring ≥70%" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Score trend */}
        <div style={{ background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Score Trend (Last 30 days)
          </h3>
          {filteredTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={filteredTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="repScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(filteredTrend.length / 5)} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="#6366f1" strokeWidth={2} fill="url(#repScoreGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 13 }}>Not enough data yet</p>
            </div>
          )}
        </div>

        {/* Checklist breakdown */}
        <div style={{ background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Score by Checklist
          </h3>
          {checklistBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={checklistBreakdown} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.replace(' Checklist', '')} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
                <Bar dataKey="avgScore" name="Avg Score" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {checklistBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 13 }}>No reviews yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Failing items + Recent calls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Failing items */}
        <div style={{ background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} color="#ef4444" />
            Top Weak Points
          </h3>
          {failingItems.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>No failing items found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {failingItems.map((item: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)',
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#ef4444',
                    background: 'rgba(239,68,68,0.12)', borderRadius: 20,
                    padding: '2px 8px', flexShrink: 0,
                  }}>
                    {item.failCount}×
                  </span>
                  <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.3 }}>
                    {item.itemText.length > 55 ? item.itemText.slice(0, 55) + '…' : item.itemText}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent calls */}
        <div style={{ background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Recent Calls
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentCalls.slice(0, 8).map((call: any) => (
              <div
                key={call.id}
                onClick={() => router.push(`/leads/${call.leadId}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)',
                  cursor: 'pointer', transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {call.leadName}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={9} />
                      {call.callDate ? formatDate(call.callDate) : '—'}
                    </span>
                    <span style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={9} />
                      {call.duration ? formatDuration(call.duration) : '—'}
                    </span>
                  </div>
                </div>
                {call.score !== null ? (
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: call.score >= 70 ? '#10b981' : call.score >= 50 ? '#f59e0b' : '#ef4444',
                    flexShrink: 0,
                  }}>
                    {Math.round(call.score)}%
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, suffix, icon, color, subtitle }: {
  title: string; value: number; suffix?: string; icon: React.ReactNode; color: string; subtitle?: string
}) {
  return (
    <div style={{
      background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            {title}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            <AnimatedNumber value={value} suffix={suffix} duration={1200} />
          </div>
          {subtitle && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{subtitle}</div>}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}22`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          {icon}
        </div>
      </div>
    </div>
  )
}
