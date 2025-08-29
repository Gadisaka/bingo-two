import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agentId = parseInt((await params).id);
    if (isNaN(agentId)) {
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const [todayStats, weeklyStats, totalStats, cashierCount] =
      await Promise.all([
        prisma.report.aggregate({
          where: {
            cashier: { agentId: agentId },
            date: { gte: today }, // ✅ use date instead of createdAt
          },
          _count: { _all: true },
          _sum: { revenue: true },
        }),
        prisma.report.aggregate({
          where: {
            cashier: { agentId: agentId },
            date: { gte: oneWeekAgo },
          },
          _count: { _all: true },
          _sum: { revenue: true },
        }),
        prisma.report.aggregate({
          where: {
            cashier: { agentId: agentId },
          },
          _count: { _all: true },
          _sum: { revenue: true },
        }),
        prisma.cashier.count({
          where: { agentId: agentId },
        }),
      ]);

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
        cashiers: cashierCount,
      },
    });
  } catch (error) {
    console.error("[AGENT_STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch agent stats" },
      { status: 500 }
    );
  }
}
