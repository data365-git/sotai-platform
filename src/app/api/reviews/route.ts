import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus } from '@prisma/client'
import type { VerdictMap } from '@/lib/types'

function recalculateScore(
  verdicts: VerdictMap,
  items: { id: string; weight: number }[]
): number {
  let earned = 0
  let total = 0
  for (const item of items) {
    total += item.weight
    const v = verdicts[item.id]
    if (!v) continue
    if (v.verdict === 'pass') earned += item.weight
    else if (v.verdict === 'unclear') earned += item.weight * 0.5
  }
  return total > 0 ? (earned / total) * 100 : 0
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { leadId },
      include: {
        checklist: { include: { items: { orderBy: { order: 'asc' } } } },
        reviewer: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('GET /api/reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, checklistId, verdicts, summary, isLocked, reviewedBy } = body

    if (!leadId || !checklistId || !verdicts) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get checklist items for score calculation
    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: { items: true },
    })

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    }

    const score = recalculateScore(verdicts as VerdictMap, checklist.items)

    // Upsert review using @@unique([leadId, checklistId])
    const review = await prisma.review.upsert({
      where: { leadId_checklistId: { leadId, checklistId } },
      update: {
        verdicts,
        score,
        summary: summary || null,
        isLocked: isLocked || false,
        reviewedBy: reviewedBy || null,
        updatedAt: new Date(),
      },
      create: {
        leadId,
        checklistId,
        verdicts,
        score,
        summary: summary || null,
        isLocked: isLocked || false,
        reviewedBy: reviewedBy || null,
      },
      include: {
        checklist: { include: { items: { orderBy: { order: 'asc' } } } },
        reviewer: true,
      },
    })

    // If locked, update lead status to REVIEWED
    if (isLocked) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: LeadStatus.REVIEWED },
      })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error('POST /api/reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
