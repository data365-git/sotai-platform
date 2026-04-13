'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, Cell, ReferenceLine,
} from 'recharts'
import { TrendingUp, Users, BarChart2, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/hooks/useAnalytics'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { ScoreRing } from '@/components/common/ScoreRing'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'

const COLORS = ['#6366f1', '#7c3aed', '#06b6d4', '#ec4899', '#f59e0b', '#14b8a6']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ color: '#475569', marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || '#f1f5f9', fontWeight: 600 }}>
          {p.name}: {Math.round(p.value)}{p.name?.includes('Score') || p.name?.includes('score') ? '%' : ''}
        </div>
      ))}
    </div>
  )
}

function KPICard({ title, value, suffix, icon, color, subtitle }: {
  title: string, value: number, suffix?: string, icon: React.ReactNode, color: string, subtitle?: string
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
          {subtitle && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}22`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { data, isLoading } = useAnalytics()

  if (isLoading) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => <LoadingSkeleton key={i} height={110} />)}
        </div>
        <LoadingSkeleton height={280} className="mb-4" />
        <LoadingSkeleton height={280} />
      </div>
    )
  }

  if (!data) return null

  const { kpis, repPerformance, scoreTrend, failingItems, reps } = data

  // Filter out zero-data trend
  const filteredTrend = (scoreTrend || []).filter((d: any) => d.avgScore > 0)

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BarChart2 size={18} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
            Analytics
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, marginTop: 1 }}>
            Performance overview & trends
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <KPICard
          title="Total Reviews"
          value={kpis?.totalCalls || 0}
          icon={<Users size={18} />}
          color="#6366f1"
          subtitle="calls analyzed"
        />
        <KPICard
          title="Avg Score"
          value={kpis?.avgScore || 0}
          suffix="%"
          icon={<TrendingUp size={18} />}
          color="#10b981"
          subtitle="across all reps"
        />
        <KPICard
          title="Pass Rate"
          value={kpis?.passRate || 0}
          suffix="%"
          icon={<CheckCircle size={18} />}
          color="#f59e0b"
          subtitle="scoring ≥70%"
        />
        <div style={{
          background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 12, padding: '20px 22px',
        }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Most Active Rep
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {kpis?.mostActiveRep?.name || kpis?.mostActiveRep || 'N/A'}
          </div>
          {kpis?.mostActiveRep?.count && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              {kpis.mostActiveRep.count} calls reviewed
            </div>
          )}
        </div>
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Rep Performance Bar Chart */}
        <div style={{ background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Rep Performance
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={repPerformance} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis
                dataKey="repName"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => v.split(' ')[0]}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
              <Bar dataKey="avgScore" name="Avg Score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {(repPerformance || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Trend */}
        <div style={{ background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Score Trend (Last 30 days)
          </h3>
          {filteredTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={filteredTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(filteredTrend.length / 5)}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.5} />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  name="Avg Score"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 13 }}>Not enough data for trend chart</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Failing Items */}
        <div style={{ background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} color="#ef4444" />
            Top Failing Criteria
          </h3>
          {(failingItems || []).length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              No failing items found
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={(failingItems || []).slice(0, 8)}
                layout="vertical"
                margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="itemText"
                  width={180}
                  tick={{ fill: '#475569', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 28) + '...' : v}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239,68,68,0.06)' }} />
                <Bar dataKey="failCount" name="Fail Count" fill="#ef4444" fillOpacity={0.7} radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rep cards */}
        <div style={{ background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Team Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(reps || []).map((rep: any, i: number) => (
              <div
                key={rep.id}
                onClick={() => router.push(`/analytics/rep/${rep.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.02)', borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.04)',
                  cursor: 'pointer', transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
              >
                <ScoreRing score={rep.avgScore} size={48} strokeWidth={5} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{rep.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {rep.callCount} call{rep.callCount !== 1 ? 's' : ''} reviewed
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: COLORS[i % COLORS.length] + '20',
                  border: `1px solid ${COLORS[i % COLORS.length]}40`,
                  color: COLORS[i % COLORS.length],
                }}>
                  {Math.round(rep.avgScore)}%
                </div>
                <ChevronRight size={14} color="#64748b" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div style={{
        textAlign: 'center', padding: '12px',
        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
        borderRadius: 8, fontSize: 12, color: '#64748b',
      }}>
        Analytics are based on reviewed and AI-ready calls only.
        Connect Bitrix24 to see real-time data.
      </div>
    </div>
  )
}
