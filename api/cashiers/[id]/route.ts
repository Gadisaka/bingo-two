// app/api/agents/[id]/route.ts
import { NextResponse } from 'next/server'
import {prisma} from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const agent = await prisma.cashier.findUnique({
      where: { id: parseInt((await params).id) },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json(agent)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

// app/api/agents/[id]/route.ts (PUT handler)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json()
    const updatedAgent = await prisma.cashier.update({
      where: { id: parseInt((await params).id) },
      data: {
        name: data.name,
        phone: data.phone,
        status: data.status
      }
    })
    return NextResponse.json(updatedAgent)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 400 }
    )
  }
}