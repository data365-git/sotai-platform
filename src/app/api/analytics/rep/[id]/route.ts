import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import type { VerdictMap } from '@/lib/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: repId } = await params

    const rep = await prisma.salesRep.findUnique({ where: { id: repId } })
    if (!rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    const leads = await prisma.lead.findMany({
      where: { repId },
      include: {
        recordings: {
          include: {
            reviews: {
              include: {
                checklist: { include: { items: true } },
              },
            },
          },
          orderBy: { callDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const allRecordings = leads.flatMap((l) =>
      l.recordings.map((r) => ({ ...r, leadName: l.name, leadId: l.id }))
    )

    const reviewedRecordings = allRecordings.filter((r) => r.reviews.length > 0)
    const allScores = reviewedRecordings.flatMap((r) => r.reviews.map((rev) => rev.score))

    const totalCalls = allRecordings.length
    const avgScore = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0
    const passRate = allScores.length > 0
      ? (allScores.filter((s) => s >= 70).length / allScores.length) * 100
      : 0

    // Score trend: last 30 days
    const scoreTrend = []
    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const dayScores = allRecordings
        .filter((r) => {
          const d = new Date(r.callDate)
          return d >= dayStart && d <= dayEnd
        })
        .flatMap((r) => r.reviews.map((rev) => rev.score))
      scoreTrend.push({
        date: format(day, 'MMM dd'),
        avgScore: dayScores.length > 0
          ? dayScores.reduce((a, b) => a + b, 0) / dayScores.length
          : 0,
      })
    }

    // Checklist breakdown
    const checklistMap = new Map<string, { name: string; scores: number[]; count: number }>()
    for (const recording of reviewedRecordings) {
      for (const review of recording.reviews) {
        const key = review.checklistId
        if (!checklistMap.has(key)) {
          checklistMap.set(key, { name: review.checklist.name, scores: [], count: 0 })
        }
        const entry = checklistMap.get(key)!
        entry.scores.push(review.score)
        entry.count++
      }
    }
    const checklistBreakdown = Array.from(checklistMap.values()).map((c) => ({
      name: c.name,
      avgScore: c.scores.length > 0 ? c.scores.reduce((a, b) => a + b, 0) / c.scores.length : 0,
      count: c.count,
    }))

    // Failing items for this rep
    const itemFailCount = new Map<string, { itemText: string; failCount: number; checklistName: string }>()
    for (const recording of reviewedRecordings) {
      for (const review of recording.reviews) {
        const verdicts = review.verdicts as unknown as VerdictMap
        for (const item of review.checklist.items) {
          const v = verdicts[item.id]
          if (v && v.verdict === 'fail') {
            if (!itemFailCount.has(item.id)) {
              itemFailCount.set(item.id, {
                itemText: item.text,
                failCount: 0,
                checklistName: review.checklist.name,
              })
            }
            itemFailCount.get(item.id)!.failCount++
          }
        }
      }
    }
    const failingItems = Array.from(itemFailCount.values())
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 8)

    // Recent calls (up to 20)
    const recentCalls = allRecordings.slice(0, 20).map((r) => ({
      id: r.id,
      leadId: r.leadId,
      leadName: r.leadName,
      callDate: r.callDate,
      duration: r.duration,
      score: r.reviews[0]?.score ?? null,
      checklistName: r.reviews[0]?.checklist?.name ?? null,
      isLocked: r.reviews[0]?.isLocked ?? false,
    }))

    return NextResponse.json({
      rep,
      kpis: {
        totalCalls,
        avgScore: Math.round(avgScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        reviewedCalls: reviewedRecordings.length,
      },
      scoreTrend,
      checklistBreakdown,
      failingItems,
      recentCalls,
    })
  } catch (error) {
    console.error('GET /api/analytics/rep/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
