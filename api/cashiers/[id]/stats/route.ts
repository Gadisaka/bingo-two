import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cashierId = parseInt((await params).id)
    if (isNaN(cashierId)) {
      return NextResponse.json({ error: 'Invalid cashier ID' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(today.getDate() - 7)

    const [todayStats, weeklyStats, totalStats] = await Promise.all([
      prisma.report.aggregate({
        where: {
          cashierId,
          date: { gte: today }, // ✅ use date instead of createdAt
        },
        _count: { _all: true },
        _sum: { revenue: true },
      }),
      prisma.report.aggregate({
        where: {
          cashierId,
          date: { gte: oneWeekAgo },
        },
        _count: { _all: true },
        _sum: { revenue: true },
      }),
      prisma.report.aggregate({
        where: {
          cashierId,
        },
        _count: { _all: true },
        _sum: { revenue: true },
      }),
    ])

    return NextResponse.json({
      today: {
        games: todayStats._count._all || 0,
        revenue: todayStats._sum.revenue || 0,
      },
      weekly: {
        games: weeklyStats._count._all || 0,
        revenue: weeklyStats._sum.revenue || 0,
      },
      total: {
        games: totalStats._count._all || 0,
        revenue: totalStats._sum.revenue || 0,
      },
    })
  } catch (error) {
    console.error('[CASHIER_STATS_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
