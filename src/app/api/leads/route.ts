import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const repId = searchParams.get('repId') || ''
    const statusParam = searchParams.get('status') || ''
    const scoreMin = searchParams.get('scoreMin')
    const scoreMax = searchParams.get('scoreMax')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Prisma.LeadWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    if (repId) {
      where.repId = repId
    }

    if (statusParam) {
      const statuses = statusParam.split(',').filter(Boolean) as LeadStatus[]
      if (statuses.length > 0) {
        where.status = { in: statuses }
      }
    }

    if (dateFrom || dateTo) {
      where.callDate = {}
      if (dateFrom) where.callDate.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        where.callDate.lte = end
      }
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        rep: { select: { id: true, name: true, email: true, avatar: true } },
        reviews: {
          select: {
            score: true,
            checklist: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { callDate: 'desc' },
    })

    // Filter by score if needed (after fetch since score is on review)
    let result = leads.map((lead) => {
      const latestReview = lead.reviews[0]
      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        repId: lead.repId,
        rep: lead.rep,
        callDate: lead.callDate.toISOString(),
        callDuration: lead.callDuration,
        status: lead.status,
        bitrix24Id: lead.bitrix24Id,
        bitrix24Status: lead.bitrix24Status,
        audioUrl: lead.audioUrl,
        latestScore: latestReview ? latestReview.score : null,
        latestChecklistName: latestReview ? latestReview.checklist.name : null,
      }
    })

    if (scoreMin !== null) {
      result = result.filter((l) => l.latestScore !== null && l.latestScore >= Number(scoreMin))
    }
    if (scoreMax !== null) {
      result = result.filter((l) => l.latestScore !== null && l.latestScore <= Number(scoreMax))
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/leads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, repId, callDate, callDuration, audioUrl } = body

    if (!name || !phone || !repId || !callDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        repId,
        callDate: new Date(callDate),
        callDuration: callDuration || 0,
        audioUrl: audioUrl || null,
        status: LeadStatus.NOT_REVIEWED,
      },
      include: { rep: true },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('POST /api/leads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
