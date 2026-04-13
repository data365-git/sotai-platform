import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, audioUrl, audioPeaks, duration, callDate, order } = body

    if (!leadId || !callDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const recording = await prisma.callRecording.create({
      data: {
        leadId,
        audioUrl: audioUrl || null,
        audioPeaks: audioPeaks || null,
        duration: duration || 0,
        callDate: new Date(callDate),
        order: order || 1,
      },
    })

    return NextResponse.json(recording, { status: 201 })
  } catch (error) {
    console.error('POST /api/recordings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
