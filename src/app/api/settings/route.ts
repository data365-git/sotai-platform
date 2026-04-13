import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        aiProvider: 'gemini',
        aiModel: 'gemini-1.5-pro',
        scorePassThreshold: 70.0,
      },
    })

    return NextResponse.json({
      ...settings,
      updatedAt: settings.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      bitrix24WebhookUrl,
      defaultChecklistId,
      aiProvider,
      aiModel,
      scorePassThreshold,
      reviewerSignature,
    } = body

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        ...(bitrix24WebhookUrl !== undefined && { bitrix24WebhookUrl }),
        ...(defaultChecklistId !== undefined && { defaultChecklistId }),
        ...(aiProvider !== undefined && { aiProvider }),
        ...(aiModel !== undefined && { aiModel }),
        ...(scorePassThreshold !== undefined && { scorePassThreshold: Number(scorePassThreshold) }),
        ...(reviewerSignature !== undefined && { reviewerSignature }),
      },
      create: {
        id: 1,
        bitrix24WebhookUrl: bitrix24WebhookUrl || null,
        defaultChecklistId: defaultChecklistId || null,
        aiProvider: aiProvider || 'gemini',
        aiModel: aiModel || 'gemini-1.5-pro',
        scorePassThreshold: scorePassThreshold || 70.0,
        reviewerSignature: reviewerSignature || null,
      },
    })

    return NextResponse.json({
      ...settings,
      updatedAt: settings.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
