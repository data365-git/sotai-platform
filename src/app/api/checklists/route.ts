import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const checklists = await prisma.checklist.findMany({
      include: {
        items: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json(checklists)
  } catch (error) {
    console.error('GET /api/checklists error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, isDefault, items } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.checklist.updateMany({ data: { isDefault: false } })
    }

    const checklist = await prisma.checklist.create({
      data: {
        name,
        description: description || null,
        isDefault: isDefault || false,
        items: {
          create:
            (items || []).map((item: { text: string; type: string; weight: number; order: number }, idx: number) => ({
              text: item.text,
              type: item.type || 'YES_NO',
              weight: item.weight || 1.0,
              order: item.order ?? idx,
            })),
        },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(checklist, { status: 201 })
  } catch (error) {
    console.error('POST /api/checklists error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
