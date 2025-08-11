// app/api/dashboard/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Get JWT token from cookie
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify token and get user info
  const payload = verifyJwt(token);

  if (!payload || typeof payload !== "object" || !payload.id || !payload.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.id as number;
  const role = (payload.role as string).toUpperCase();

  let gamesToday = 0;
  let gamesWeekly = 0;
  let gamesTotal = 0;

  let revenueToday = 0;
  let revenueWeekly = 0;
  let revenueTotal = 0;

  let adminsCount = 0;
  let agentsCount = 0;
  let cashiersCount = 0;

  // Date helpers
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

  if (role === "ADMIN") {
    // Admin sees all reports

    gamesTotal = await prisma.report.count();

    gamesToday = await prisma.report.count({
      where: { date: { gte: startOfToday } },
    });

    gamesWeekly = await prisma.report.count({
      where: { date: { gte: startOfWeek } },
    });

    const revenueAggregates = await prisma.report.aggregate({
      _sum: { revenue: true },
    });
    revenueTotal = revenueAggregates._sum.revenue || 0;

    const revenueTodayAgg = await prisma.report.aggregate({
      where: { date: { gte: startOfToday } },
      _sum: { revenue: true },
    });
    revenueToday = revenueTodayAgg._sum.revenue || 0;

    const revenueWeeklyAgg = await prisma.report.aggregate({
      where: { date: { gte: startOfWeek } },
      _sum: { revenue: true },
    });
    revenueWeekly = revenueWeeklyAgg._sum.revenue || 0;

    adminsCount = await prisma.admin.count();
    agentsCount = await prisma.agent.count();
    cashiersCount = await prisma.cashier.count();
  } else if (role === "AGENT") {
    // Agent sees reports for own cashiers

    const cashiers = await prisma.cashier.findMany({
      where: { agentId: userId },
      select: { id: true },
    });

    const agent = await prisma.agent.findUnique({ where: { id: userId } });
    const cashierIds = cashiers.map((c) => c.id);

    gamesTotal = await prisma.report.count({
      where: { cashierId: { in: cashierIds } },
    });

    gamesToday = await prisma.report.count({
      where: {
        cashierId: { in: cashierIds },
        date: { gte: startOfToday },
      },
    });

    gamesWeekly = await prisma.report.count({
      where: {
        cashierId: { in: cashierIds },
        date: { gte: startOfWeek },
      },
    });

    const revenueTotalAgg = await prisma.report.aggregate({
      where: { cashierId: { in: cashierIds } },
      _sum: { revenue: true },
    });
    revenueTotal = revenueTotalAgg._sum.revenue || 0;

    const revenueTodayAgg = await prisma.report.aggregate({
      where: {
        cashierId: { in: cashierIds },
        date: { gte: startOfToday },
      },
      _sum: { revenue: true },
    });
    revenueToday = revenueTodayAgg._sum.revenue || 0;

    const revenueWeeklyAgg = await prisma.report.aggregate({
      where: {
        cashierId: { in: cashierIds },
        date: { gte: startOfWeek },
      },
      _sum: { revenue: true },
    });
    revenueWeekly = revenueWeeklyAgg._sum.revenue || 0;

    adminsCount = 1; // self/admin count can be adjusted
    agentsCount = agent?.walletBalance || 0;
    cashiersCount = cashierIds.length;
  } else if (role === "CASHIER") {
    // Cashier sees own reports

    const cashier = await prisma.cashier.findUnique({ where: { id: userId } });
    const agent = await prisma.agent.findUnique({
      where: { id: cashier?.agentId },
    });

    gamesTotal = await prisma.report.count({
      where: { cashierId: userId },
    });

    gamesToday = await prisma.report.count({
      where: {
        cashierId: userId,
        date: { gte: startOfToday },
      },
    });

    gamesWeekly = await prisma.report.count({
      where: {
        cashierId: userId,
        date: { gte: startOfWeek },
      },
    });

    const revenueTotalAgg = await prisma.report.aggregate({
      where: { cashierId: userId },
      _sum: { revenue: true },
    });
    revenueTotal = revenueTotalAgg._sum.revenue || 0;

    const revenueTodayAgg = await prisma.report.aggregate({
      where: {
        cashierId: userId,
        date: { gte: startOfToday },
      },
      _sum: { revenue: true },
    });
    revenueToday = revenueTodayAgg._sum.revenue || 0;

    const revenueWeeklyAgg = await prisma.report.aggregate({
      where: {
        cashierId: userId,
        date: { gte: startOfWeek },
      },
      _sum: { revenue: true },
    });
    revenueWeekly = revenueWeeklyAgg._sum.revenue || 0;

    adminsCount = 1;
    agentsCount = 1;
    cashiersCount = agent?.walletBalance || 0;
  } else {
    return NextResponse.json({ error: "Invalid role" }, { status: 403 });
  }

  return NextResponse.json({
    games: {
      today: gamesToday,
      weekly: gamesWeekly,
      total: gamesTotal,
    },
    revenue: {
      today: revenueToday,
      weekly: revenueWeekly,
      total: revenueTotal,
    },
    users: {
      admins: adminsCount,
      agents: agentsCount,
      cashiers: cashiersCount,
    },
  });
}
