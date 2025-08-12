import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id || !payload.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only ADMIN can access agent income reports
  if (payload.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  try {
    // Get all agents with their reports
    const agents = await prisma.agent.findMany({
      where: {
        adminId: payload.id,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        cashiers: {
          include: {
            reports: {
              where: {
                ...(from || to
                  ? {
                      date: {
                        ...(from && { gte: new Date(from) }),
                        ...(to && { lte: new Date(to) }),
                      },
                    }
                  : {}),
              },
            },
          },
        },
      },
    });

    // Calculate income for each agent
    const agentIncomeReports = agents.map((agent) => {
      const allReports = agent.cashiers.flatMap((cashier) => cashier.reports);

      // Calculate daily income (last 24 hours)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const dailyReports = allReports.filter(
        (report) => new Date(report.date) >= yesterday
      );
      const dailyIncome = dailyReports.reduce(
        (sum, report) => sum + (report.agentCommission || 0),
        0
      );

      // Calculate weekly income (last 7 days)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyReports = allReports.filter(
        (report) => new Date(report.date) >= weekAgo
      );
      const weeklyIncome = weeklyReports.reduce(
        (sum, report) => sum + (report.agentCommission || 0),
        0
      );

      // Calculate monthly income (last 30 days)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthlyReports = allReports.filter(
        (report) => new Date(report.date) >= monthAgo
      );
      const monthlyIncome = monthlyReports.reduce(
        (sum, report) => sum + (report.agentCommission || 0),
        0
      );

      // Calculate total income (all time)
      const totalIncome = allReports.reduce(
        (sum, report) => sum + (report.agentCommission || 0),
        0
      );

      // Calculate total revenue and bet amounts
      const totalRevenue = allReports.reduce(
        (sum, report) => sum + (report.revenue || 0),
        0
      );
      const totalBetAmount = allReports.reduce(
        (sum, report) => sum + (report.betAmount || 0),
        0
      );
      const totalRegisteredNumbers = allReports.reduce(
        (sum, report) => sum + (report.registeredNumbers || 0),
        0
      );

      return {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        status: agent.status,
        dailyIncome: parseFloat(dailyIncome.toFixed(2)),
        weeklyIncome: parseFloat(weeklyIncome.toFixed(2)),
        monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalBetAmount: parseFloat(totalBetAmount.toFixed(2)),
        totalRegisteredNumbers,
        cashierCount: agent.cashiers.length,
        reportCount: allReports.length,
      };
    });

    // Sort by total income descending
    agentIncomeReports.sort((a, b) => b.totalIncome - a.totalIncome);

    // Calculate totals
    const totals = agentIncomeReports.reduce(
      (acc, agent) => ({
        dailyIncome: acc.dailyIncome + agent.dailyIncome,
        weeklyIncome: acc.weeklyIncome + agent.weeklyIncome,
        monthlyIncome: acc.monthlyIncome + agent.monthlyIncome,
        totalIncome: acc.totalIncome + agent.totalIncome,
        totalRevenue: acc.totalRevenue + agent.totalRevenue,
        totalBetAmount: acc.totalBetAmount + agent.totalBetAmount,
        totalRegisteredNumbers:
          acc.totalRegisteredNumbers + agent.totalRegisteredNumbers,
      }),
      {
        dailyIncome: 0,
        weeklyIncome: 0,
        monthlyIncome: 0,
        totalIncome: 0,
        totalRevenue: 0,
        totalBetAmount: 0,
        totalRegisteredNumbers: 0,
      }
    );

    return NextResponse.json({
      agents: agentIncomeReports,
      totals: {
        dailyIncome: parseFloat(totals.dailyIncome.toFixed(2)),
        weeklyIncome: parseFloat(totals.weeklyIncome.toFixed(2)),
        monthlyIncome: parseFloat(totals.monthlyIncome.toFixed(2)),
        totalIncome: parseFloat(totals.totalIncome.toFixed(2)),
        totalRevenue: parseFloat(totals.totalRevenue.toFixed(2)),
        totalBetAmount: parseFloat(totals.totalBetAmount.toFixed(2)),
        totalRegisteredNumbers: totals.totalRegisteredNumbers,
      },
    });
  } catch (error) {
    console.error("Error fetching agent income reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent income reports" },
      { status: 500 }
    );
  }
}
