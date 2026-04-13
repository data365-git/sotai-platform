import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import type { VerdictMap } from '@/lib/types'

export async function GET() {
  try {
    // Fetch all leads with reviews and reps
    const leads = await prisma.lead.findMany({
      include: {
        rep: true,
        reviews: {
          include: {
            checklist: { include: { items: true } },
          },
        },
      },
    })

    const reviewedLeads = leads.filter(
      (l) => l.status === 'REVIEWED' || l.status === 'AI_READY'
    )

    // KPIs
    const totalCalls = reviewedLeads.length

    const allScores = reviewedLeads
      .flatMap((l) => l.reviews.map((r) => r.score))
      .filter((s) => typeof s === 'number')

    const avgScore = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0

    const passRate = allScores.length > 0
      ? (allScores.filter((s) => s >= 70).length / allScores.length) * 100
      : 0

    // Rep performance
    const repMap = new Map<string, { repId: string; repName: string; scores: number[]; callCount: number }>()
    for (const lead of leads) {
      if (!repMap.has(lead.repId)) {
        repMap.set(lead.repId, {
          repId: lead.repId,
          repName: lead.rep.name,
          scores: [],
          callCount: 0,
        })
      }
      const repData = repMap.get(lead.repId)!
      repData.callCount++
      for (const review of lead.reviews) {
        repData.scores.push(review.score)
      }
    }

    const repPerformance = Array.from(repMap.values()).map((r) => ({
      repId: r.repId,
      repName: r.repName,
      avgScore: r.scores.length > 0 ? r.scores.reduce((a, b) => a + b, 0) / r.scores.length : 0,
      callCount: r.callCount,
    }))

    // Most active rep
    const mostActiveRep = repPerformance.sort((a, b) => b.callCount - a.callCount)[0]?.repName || 'N/A'

    // Re-sort repPerformance by avgScore
    repPerformance.sort((a, b) => b.avgScore - a.avgScore)

    // Score trend: last 30 days
    const scoreTrend = []
    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      const dayReviews = leads
        .filter((l) => {
          const d = new Date(l.callDate)
          return d >= dayStart && d <= dayEnd
        })
        .flatMap((l) => l.reviews.map((r) => r.score))

      scoreTrend.push({
        date: format(day, 'MMM dd'),
        avgScore: dayReviews.length > 0
          ? dayReviews.reduce((a, b) => a + b, 0) / dayReviews.length
          : 0,
      })
    }

    // Failing items: count fail verdicts per checklist item
    const itemFailCount = new Map<string, { itemText: string; failCount: number; checklistName: string }>()

    for (const lead of leads) {
      for (const review of lead.reviews) {
        const verdicts = review.verdicts as unknown as VerdictMap
        for (const item of review.checklist.items) {
          const v = verdicts[item.id]
          if (v && v.verdict === 'fail') {
            const key = item.id
            if (!itemFailCount.has(key)) {
              itemFailCount.set(key, {
                itemText: item.text,
                failCount: 0,
                checklistName: review.checklist.name,
              })
            }
            itemFailCount.get(key)!.failCount++
          }
        }
      }
    }

    const failingItems = Array.from(itemFailCount.values())
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 10)

    // Reps summary
    const reps = Array.from(repMap.values()).map((r) => ({
      id: r.repId,
      name: r.repName,
      callCount: r.callCount,
      avgScore: r.scores.length > 0 ? r.scores.reduce((a, b) => a + b, 0) / r.scores.length : 0,
    }))

    return NextResponse.json({
      kpis: {
        totalCalls,
        avgScore: Math.round(avgScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        mostActiveRep,
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
