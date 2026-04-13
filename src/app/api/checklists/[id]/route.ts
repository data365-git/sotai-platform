import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const checklist = await prisma.checklist.findUnique({
      where: { id },
      include: { items: { orderBy: { order: 'asc' } } },
    })

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    }

    return NextResponse.json(checklist)
  } catch (error) {
    console.error('GET /api/checklists/[id] error:', error)
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
    const { name, description, isDefault, items } = body

    // If setting as default, unset others first
    if (isDefault) {
      await prisma.checklist.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      })
    }

    // Delete existing items and recreate (simplest upsert for ordered list)
    await prisma.checklistItem.deleteMany({ where: { checklistId: id } })

    const checklist = await prisma.checklist.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
        items: {
          create: (items || []).map(
            (item: { text: string; type: string; weight: number; order: number }, idx: number) => ({
              text: item.text,
              type: item.type || 'YES_NO',
              weight: item.weight || 1.0,
              order: item.order ?? idx,
            })
          ),
        },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(checklist)
  } catch (error) {
    console.error('PUT /api/checklists/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.checklist.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/checklists/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
