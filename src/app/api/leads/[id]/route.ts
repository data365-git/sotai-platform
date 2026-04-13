import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        rep: true,
        transcript: true,
        reviews: {
          include: {
            checklist: {
              include: {
                items: { orderBy: { order: 'asc' } },
              },
            },
            reviewer: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...lead,
      callDate: lead.callDate.toISOString(),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('GET /api/leads/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.bitrix24Id !== undefined && { bitrix24Id: body.bitrix24Id }),
        ...(body.bitrix24Status !== undefined && { bitrix24Status: body.bitrix24Status }),
        ...(body.audioUrl !== undefined && { audioUrl: body.audioUrl }),
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('PUT /api/leads/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
