import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import type { VerdictMap } from '@/lib/types'

function computeKpis(recordings: any[]) {
  const reviewedRecordings = recordings.filter((r) => r.reviews.length > 0)
  const totalCalls = recordings.length
  const allScores = reviewedRecordings.flatMap((r: any) => r.reviews.map((rev: any) => rev.score))
  const avgScore = allScores.length > 0 ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length : 0
  const passRate = allScores.length > 0 ? (allScores.filter((s: number) => s >= 70).length / allScores.length) * 100 : 0
  return { totalCalls, avgScore, passRate, reviewCount: allScores.length }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.max(1, Math.min(365, parseInt(searchParams.get('days') ?? '30', 10)))

    const now = new Date()
    const periodStart = startOfDay(subDays(now, days - 1))
    const prevPeriodStart = startOfDay(subDays(now, days * 2 - 1))
    const prevPeriodEnd = startOfDay(subDays(now, days))

    // Fetch all leads with recordings (both current and previous period)
    const leads = await prisma.lead.findMany({
      include: {
        rep: true,
        recordings: {
          include: {
            reviews: {
              include: { checklist: { include: { items: true } } },
            },
          },
        },
      },
    })

    const allRecordings = leads.flatMap((l) =>
      l.recordings.map((r) => ({ ...r, rep: l.rep, repId: l.repId }))
    )

    // Split into current vs previous period
    const currentPeriod = allRecordings.filter((r) => new Date(r.callDate) >= periodStart)
    const prevPeriod = allRecordings.filter((r) => {
      const d = new Date(r.callDate)
      return d >= prevPeriodStart && d < prevPeriodEnd
    })

    const kpisNow = computeKpis(currentPeriod)
    const kpisPrev = computeKpis(prevPeriod)

    // Deltas (null if no prior data)
    const delta = (curr: number, prev: number) =>
      prev > 0 ? Math.round((curr - prev) * 10) / 10 : null

    // Rep performance (current period)
    const repMap = new Map<string, { repId: string; repName: string; scores: number[]; callCount: number }>()
    for (const recording of currentPeriod) {
      if (!repMap.has(recording.repId)) {
        repMap.set(recording.repId, { repId: recording.repId, repName: recording.rep.name, scores: [], callCount: 0 })
      }
      const repData = repMap.get(recording.repId)!
      repData.callCount++
      for (const review of recording.reviews) repData.scores.push(review.score)
    }

    const repPerformance = Array.from(repMap.values()).map((r) => ({
      repId: r.repId,
      repName: r.repName,
      avgScore: r.scores.length > 0 ? r.scores.reduce((a, b) => a + b, 0) / r.scores.length : 0,
      callCount: r.callCount,
    })).sort((a, b) => b.avgScore - a.avgScore)

    // Most active rep
    const mostActiveRepData = [...Array.from(repMap.values())].sort((a, b) => b.callCount - a.callCount)[0]
    const mostActiveRep = mostActiveRepData
      ? { name: mostActiveRepData.repName, count: mostActiveRepData.callCount }
      : null

    // Score trend (for the selected period)
    const scoreTrend = []
    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(now, i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const dayScores = allRecordings
        .filter((r) => { const d = new Date(r.callDate); return d >= dayStart && d <= dayEnd })
        .flatMap((r) => r.reviews.map((rev: any) => rev.score))
      scoreTrend.push({
        date: days <= 14 ? format(day, 'MMM dd') : format(day, 'MMM dd'),
        avgScore: dayScores.length > 0 ? dayScores.reduce((a, b) => a + b, 0) / dayScores.length : 0,
      })
    }

    // Failing items (all time for relevance, or current period)
    const itemFailCount = new Map<string, { itemText: string; failCount: number }>()
    for (const recording of currentPeriod) {
      for (const review of recording.reviews) {
        const verdicts = review.verdicts as unknown as VerdictMap
        for (const item of review.checklist.items) {
          const v = verdicts[item.id]
          if (v && v.verdict === 'fail') {
            if (!itemFailCount.has(item.id)) {
              itemFailCount.set(item.id, { itemText: item.text, failCount: 0 })
            }
            itemFailCount.get(item.id)!.failCount++
          }
        }
      }
    }

    const failingItems = Array.from(itemFailCount.values())
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 10)

    // All-time rep summary for team overview
    const allRepMap = new Map<string, { repId: string; repName: string; scores: number[]; callCount: number }>()
    for (const recording of allRecordings) {
      if (!allRepMap.has(recording.repId)) {
        allRepMap.set(recording.repId, { repId: recording.repId, repName: recording.rep.name, scores: [], callCount: 0 })
      }
      const rd = allRepMap.get(recording.repId)!
      rd.callCount++
      for (const review of recording.reviews) rd.scores.push(review.score)
    }

    const reps = Array.from(allRepMap.values()).map((r) => ({
      id: r.repId,
      name: r.repName,
      callCount: r.callCount,
      avgScore: r.scores.length > 0 ? r.scores.reduce((a, b) => a + b, 0) / r.scores.length : 0,
    }))

    return NextResponse.json({
      period: days,
      kpis: {
        totalCalls: kpisNow.totalCalls,
        avgScore: Math.round(kpisNow.avgScore * 10) / 10,
        passRate: Math.round(kpisNow.passRate * 10) / 10,
        mostActiveRep,
        deltas: {
          totalCalls: delta(kpisNow.totalCalls, kpisPrev.totalCalls),
          avgScore: delta(kpisNow.avgScore, kpisPrev.avgScore),
          passRate: delta(kpisNow.passRate, kpisPrev.passRate),
        },
      },
      repPerformance,
      scoreTrend,
      failingItems,
      reps,
    })
  } catch (error) {
    console.error('GET /api/analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
