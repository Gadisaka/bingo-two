// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id || !payload.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.id as number;
  const role = (payload.role as string).toUpperCase();

  // Calculate date ranges
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    if (role === "ADMIN") {
      // Admin dashboard - show all data
      let revenueTotal = 0;
      let revenueToday = 0;
      let revenueWeekly = 0;
      let totalBetAll = 0;
      let totalBetToday = 0;
      let totalBetWeekly = 0;
      let agentCommissionAll = 0;
      let agentCommissionToday = 0;
      let agentCommissionWeekly = 0;
      let adminCommissionAll = 0;
      let adminCommissionToday = 0;
      let adminCommissionWeekly = 0;

      try {
        const aggAll = await prisma.report.aggregate({
          _sum: {
            revenue: true,
            totalBet: true,
            agentCommission: true,
            adminCommission: true,
          },
        });
        revenueTotal = aggAll._sum.revenue || 0;
        totalBetAll = aggAll._sum.totalBet || 0;
        agentCommissionAll = aggAll._sum.agentCommission || 0;
        adminCommissionAll = aggAll._sum.adminCommission || 0;
      } catch (error) {
        console.error("Error aggregating all reports:", error);
        // Provide default values if aggregation fails
        revenueTotal = 0;
        totalBetAll = 0;
        agentCommissionAll = 0;
        adminCommissionAll = 0;
      }

      try {
        const aggToday = await prisma.report.aggregate({
          where: { date: { gte: startOfToday } },
          _sum: {
            revenue: true,
            totalBet: true,
            agentCommission: true,
            adminCommission: true,
          },
        });
        revenueToday = aggToday._sum.revenue || 0;
        totalBetToday = aggToday._sum.totalBet || 0;
        agentCommissionToday = aggToday._sum.agentCommission || 0;
        adminCommissionToday = aggToday._sum.adminCommission || 0;
      } catch (error) {
        console.error("Error aggregating today reports:", error);
        // Provide default values if aggregation fails
        revenueToday = 0;
        totalBetToday = 0;
        agentCommissionToday = 0;
        adminCommissionToday = 0;
      }

      try {
        const aggWeek = await prisma.report.aggregate({
          where: { date: { gte: startOfWeek } },
          _sum: {
            revenue: true,
            totalBet: true,
            agentCommission: true,
            adminCommission: true,
          },
        });
        revenueWeekly = aggWeek._sum.revenue || 0;
        totalBetWeekly = aggWeek._sum.totalBet || 0;
        agentCommissionWeekly = aggWeek._sum.agentCommission || 0;
        adminCommissionWeekly = aggWeek._sum.adminCommission || 0;
      } catch (error) {
        console.error("Error aggregating weekly reports:", error);
        // Provide default values if aggregation fails
        revenueWeekly = 0;
        totalBetWeekly = 0;
        agentCommissionWeekly = 0;
        adminCommissionWeekly = 0;
      }

      // Get counts for different user types
      const agentCount = await prisma.agent.count();
      const adminCount = 1; // There's only one admin (the current user)
      const cashierCount = await prisma.cashier.count();

      // Get game counts
      const gamesTotal = await prisma.report.count();
      const gamesToday = await prisma.report.count({
        where: { date: { gte: startOfToday } },
      });
      const gamesWeekly = await prisma.report.count({
        where: { date: { gte: startOfWeek } },
      });

      // Get cashier commission data
      let cashierCommissionAll = 0;
      let cashierCommissionToday = 0;
      let cashierCommissionWeekly = 0;

      try {
        const cashierAggAll = await prisma.report.aggregate({
          _sum: { cashierCommission: true },
        });
        cashierCommissionAll = cashierAggAll._sum.cashierCommission || 0;
      } catch (error) {
        console.error("Error aggregating cashier commission:", error);
        cashierCommissionAll = 0;
      }

      try {
        const cashierAggToday = await prisma.report.aggregate({
          where: { date: { gte: startOfToday } },
          _sum: { cashierCommission: true },
        });
        cashierCommissionToday = cashierAggToday._sum.cashierCommission || 0;
      } catch (error) {
        console.error("Error aggregating today cashier commission:", error);
        cashierCommissionToday = 0;
      }

      try {
        const cashierAggWeek = await prisma.report.aggregate({
          where: { date: { gte: startOfWeek } },
          _sum: { cashierCommission: true },
        });
        cashierCommissionWeekly = cashierAggWeek._sum.cashierCommission || 0;
      } catch (error) {
        console.error("Error aggregating weekly cashier commission:", error);
        cashierCommissionWeekly = 0;
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
        totalBet: {
          today: totalBetToday,
          weekly: totalBetWeekly,
          total: totalBetAll,
        },
        commissions: {
          cashier: {
            today: cashierCommissionToday,
            weekly: cashierCommissionWeekly,
            total: cashierCommissionAll,
          },
          agent: {
            today: agentCommissionToday,
            weekly: agentCommissionWeekly,
            total: agentCommissionAll,
          },
          admin: {
            today: adminCommissionToday,
            weekly: adminCommissionWeekly,
            total: adminCommissionAll,
          },
        },
        users: {
          admins: adminCount,
          agents: agentCount,
          cashiers: cashierCount,
        },
      });
    } else if (role === "AGENT") {
      // Agent dashboard - show data for their cashiers only
      let revenueTotal = 0;
      let revenueToday = 0;
      let revenueWeekly = 0;
      let totalBetAll = 0;
      let totalBetToday = 0;
      let totalBetWeekly = 0;
      let agentCommissionAll = 0;
      let agentCommissionToday = 0;
      let agentCommissionWeekly = 0;
      let adminCommissionAll = 0;
      let adminCommissionToday = 0;
      let adminCommissionWeekly = 0;

      try {
        const aggAll = await prisma.report.aggregate({
          where: {
            cashier: { agentId: userId },
          },
          _sum: {
            revenue: true,
            totalBet: true,
            agentCommission: true,
            adminCommission: true,
          },
        });
        revenueTotal = aggAll._sum.revenue || 0;
        totalBetAll = aggAll._sum.totalBet || 0;
        agentCommissionAll = aggAll._sum.agentCommission || 0;
        adminCommissionAll = aggAll._sum.adminCommission || 0;
      } catch (error) {
        console.error("Error aggregating all reports:", error);
        // Provide default values if aggregation fails
        revenueTotal = 0;
        totalBetAll = 0;
        agentCommissionAll = 0;
        adminCommissionAll = 0;
      }

      try {
        const aggToday = await prisma.report.aggregate({
          where: {
            cashier: { agentId: userId },
            date: { gte: startOfToday },
          },
          _sum: {
            revenue: true,
            totalBet: true,
            agentCommission: true,
            adminCommission: true,
          },
        });
        revenueToday = aggToday._sum.revenue || 0;
        totalBetToday = aggToday._sum.totalBet || 0;
        agentCommissionToday = aggToday._sum.agentCommission || 0;
        adminCommissionToday = aggToday._sum.adminCommission || 0;
      } catch (error) {
        console.error("Error aggregating today reports:", error);
        // Provide default values if aggregation fails
        revenueToday = 0;
        totalBetToday = 0;
        agentCommissionToday = 0;
        adminCommissionToday = 0;
      }

      try {
        const aggWeek = await prisma.report.aggregate({
          where: {
            cashier: { agentId: userId },
            date: { gte: startOfWeek },
          },
          _sum: {
            revenue: true,
            totalBet: true,
            agentCommission: true,
            adminCommission: true,
          },
        });
        revenueWeekly = aggWeek._sum.revenue || 0;
        totalBetWeekly = aggWeek._sum.totalBet || 0;
        agentCommissionWeekly = aggWeek._sum.agentCommission || 0;
        adminCommissionWeekly = aggWeek._sum.adminCommission || 0;
      } catch (error) {
        console.error("Error aggregating weekly reports:", error);
        // Provide default values if aggregation fails
        revenueWeekly = 0;
        totalBetWeekly = 0;
        agentCommissionWeekly = 0;
        adminCommissionWeekly = 0;
      }

      // Get cashier count for this agent
      const cashierCount = await prisma.cashier.count({
        where: { agentId: userId },
      });

      // Get game counts for this agent's cashiers
      const gamesTotal = await prisma.report.count({
        where: { cashier: { agentId: userId } },
      });
      const gamesToday = await prisma.report.count({
        where: {
          cashier: { agentId: userId },
          date: { gte: startOfToday },
        },
      });
      const gamesWeekly = await prisma.report.count({
        where: {
          cashier: { agentId: userId },
          date: { gte: startOfWeek },
        },
      });

      // Get cashier commission data for this agent's cashiers
      let cashierCommissionAll = 0;
      let cashierCommissionToday = 0;
      let cashierCommissionWeekly = 0;

      try {
        const cashierAggAll = await prisma.report.aggregate({
          where: { cashier: { agentId: userId } },
          _sum: { cashierCommission: true },
        });
        cashierCommissionAll = cashierAggAll._sum.cashierCommission || 0;
      } catch (error) {
        console.error("Error aggregating cashier commission:", error);
        cashierCommissionAll = 0;
      }

      try {
        const cashierAggToday = await prisma.report.aggregate({
          where: {
            cashier: { agentId: userId },
            date: { gte: startOfToday },
          },
          _sum: { cashierCommission: true },
        });
        cashierCommissionToday = cashierAggToday._sum.cashierCommission || 0;
      } catch (error) {
        console.error("Error aggregating today cashier commission:", error);
        cashierCommissionToday = 0;
      }

      try {
        const cashierAggWeek = await prisma.report.aggregate({
          where: {
            cashier: { agentId: userId },
            date: { gte: startOfWeek },
          },
          _sum: { cashierCommission: true },
        });
        cashierCommissionWeekly = cashierAggWeek._sum.cashierCommission || 0;
      } catch (error) {
        console.error("Error aggregating weekly cashier commission:", error);
        cashierCommissionWeekly = 0;
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
        totalBet: {
          today: totalBetToday,
          weekly: totalBetWeekly,
          total: totalBetAll,
        },
        commissions: {
          cashier: {
            today: cashierCommissionToday,
            weekly: cashierCommissionWeekly,
            total: cashierCommissionAll,
          },
          agent: {
            today: agentCommissionToday,
            weekly: agentCommissionWeekly,
            total: agentCommissionAll,
          },
          admin: {
            today: adminCommissionToday,
            weekly: adminCommissionWeekly,
            total: adminCommissionAll,
          },
        },
        users: {
          cashiers: cashierCount,
        },
      });
    } else if (role === "CASHIER") {
      // Cashier dashboard - show only their data
      let revenueTotal = 0;
      let revenueToday = 0;
      let revenueWeekly = 0;
      let totalBetAll = 0;
      let totalBetToday = 0;
      let totalBetWeekly = 0;
      let agentCommissionAll = 0;
      let agentCommissionToday = 0;
      let agentCommissionWeekly = 0;
      let adminCommissionAll = 0;
      let adminCommissionToday = 0;
      let adminCommissionWeekly = 0;

      try {
        const aggAll = await prisma.report.aggregate({
          where: { cashierId: userId },
          _sum: {
            revenue: true,
            totalBet: true,
            agentCommission: true,
            adminCommission: true,
          },
        });
        revenueTotal = aggAll._sum.revenue || 0;
        totalBetAll = aggAll._sum.totalBet || 0;
        agentCommissionAll = aggAll._sum.agentCommission || 0;
        adminCommissionAll = aggAll._sum.adminCommission || 0;
      } catch (error) {
        console.error("Error aggregating all reports:", error);
        // Provide default values if aggregation fails
        revenueTotal = 0;
        totalBetAll = 0;
        agentCommissionAll = 0;
        adminCommissionAll = 0;
      }

      try {
        const aggToday = await prisma.report.aggregate({
          where: {
            cashierId: userId,
            date: { gte: startOfToday },
          },
          _sum: {
            revenue: true,
            totalBet: true,
            agentCommission: true,
            adminCommission: true,
          },
        });
        revenueToday = aggToday._sum.revenue || 0;
        totalBetToday = aggToday._sum.totalBet || 0;
        agentCommissionToday = aggToday._sum.agentCommission || 0;
        adminCommissionToday = aggToday._sum.adminCommission || 0;
      } catch (error) {
        console.error("Error aggregating today reports:", error);
        // Provide default values if aggregation fails
        revenueToday = 0;
        totalBetToday = 0;
        agentCommissionToday = 0;
        adminCommissionToday = 0;
      }

      try {
        const aggWeek = await prisma.report.aggregate({
          where: {
            cashierId: userId,
            date: { gte: startOfWeek },
          },
          _sum: {
            revenue: true,
            totalBet: true,
            agentCommission: true,
            adminCommission: true,
          },
        });
        revenueWeekly = aggWeek._sum.revenue || 0;
        totalBetWeekly = aggWeek._sum.totalBet || 0;
        agentCommissionWeekly = aggWeek._sum.agentCommission || 0;
        adminCommissionWeekly = aggWeek._sum.adminCommission || 0;
      } catch (error) {
        console.error("Error aggregating weekly reports:", error);
        // Provide default values if aggregation fails
        revenueWeekly = 0;
        totalBetWeekly = 0;
        agentCommissionWeekly = 0;
        adminCommissionWeekly = 0;
      }

      // Get game counts for this cashier
      const gamesTotal = await prisma.report.count({
        where: { cashierId: userId },
      });
      const gamesToday = await prisma.report.count({
        where: {
          cashierId: userId,
          date: { gte: startOfToday },
        },
      });
      const gamesWeekly = await prisma.report.count({
        where: {
          cashierId: userId,
          date: { gte: startOfWeek },
        },
      });

      // Get cashier commission data for this cashier
      let cashierCommissionAll = 0;
      let cashierCommissionToday = 0;
      let cashierCommissionWeekly = 0;

      try {
        const cashierAggAll = await prisma.report.aggregate({
          where: { cashierId: userId },
          _sum: { cashierCommission: true },
        });
        cashierCommissionAll = cashierAggAll._sum.cashierCommission || 0;
      } catch (error) {
        console.error("Error aggregating cashier commission:", error);
        cashierCommissionAll = 0;
      }

      try {
        const cashierAggToday = await prisma.report.aggregate({
          where: {
            cashierId: userId,
            date: { gte: startOfToday },
          },
          _sum: { cashierCommission: true },
        });
        cashierCommissionToday = cashierAggToday._sum.cashierCommission || 0;
      } catch (error) {
        console.error("Error aggregating today cashier commission:", error);
        cashierCommissionToday = 0;
      }

      try {
        const cashierAggWeek = await prisma.report.aggregate({
          where: {
            cashierId: userId,
            date: { gte: startOfWeek },
          },
          _sum: { cashierCommission: true },
        });
        cashierCommissionWeekly = cashierAggWeek._sum.cashierCommission || 0;
      } catch (error) {
        console.error("Error aggregating weekly cashier commission:", error);
        cashierCommissionWeekly = 0;
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
        totalBet: {
          today: totalBetToday,
          weekly: totalBetWeekly,
          total: totalBetAll,
        },
        commissions: {
          cashier: {
            today: cashierCommissionToday,
            weekly: cashierCommissionWeekly,
            total: cashierCommissionAll,
          },
          agent: {
            today: agentCommissionToday,
            weekly: agentCommissionWeekly,
            total: agentCommissionAll,
          },
          admin: {
            today: adminCommissionToday,
            weekly: adminCommissionWeekly,
            total: adminCommissionAll,
          },
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
