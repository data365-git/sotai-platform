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
    const recordingId = searchParams.get('recordingId')

    if (!recordingId) {
      return NextResponse.json({ error: 'recordingId is required' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { recordingId },
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
    const { recordingId, checklistId, verdicts, summary, isLocked, reviewedBy } = body

    if (!recordingId || !checklistId || !verdicts) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: { items: true },
    })

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    }

    const score = recalculateScore(verdicts as VerdictMap, checklist.items)

    const review = await prisma.review.upsert({
      where: { recordingId_checklistId: { recordingId, checklistId } },
      update: {
        verdicts,
        score,
        summary: summary || null,
        isLocked: isLocked || false,
        reviewedBy: reviewedBy || null,
        updatedAt: new Date(),
      },
      create: {
        recordingId,
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

    // If locked, update the lead's status to REVIEWED
    if (isLocked) {
      const recording = await prisma.callRecording.findUnique({
        where: { id: recordingId },
        select: { leadId: true },
      })
      if (recording) {
        await prisma.lead.update({
          where: { id: recording.leadId },
          data: { status: LeadStatus.REVIEWED },
        })
      }
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error('POST /api/reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
