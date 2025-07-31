// app/api/agents/[id]/password/route.ts
import { NextResponse } from 'next/server'
import {prisma} from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { password } = await request.json()
  
  try {
    await prisma.cashier.update({
      where: { id: parseInt((await params).id) },
      data: { password } // In real app, hash this password
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Password update failed' },
      { status: 400 }
    )
  }
}