import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cashierId = parseInt(params.id);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get cashier's jackpot settings
    const cashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
      select: {
        jackpotEnabled: true,
        jackpotPercent: true,
        jackpotStartingAmount: true,
        matchGap: true,
        dailyNumber: true,
      },
    });

    if (!cashier) {
      return NextResponse.json({ error: "Cashier not found" }, { status: 404 });
    }

    // Get today's game count from reports table
    const todayGamesCount = await prisma.report.count({
      where: {
        cashierId,
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: "ACTIVE", // Only count completed games
      },
    });

    // Calculate next game number (today's count + 1)
    const nextGameNumber = todayGamesCount + 1;

    // Check if next game will be jackpot eligible
    let nextGameJackpotEligible = false;
    if (cashier.jackpotEnabled === "On") {
      // Game numbers that get jackpot: 1, 1+matchGap, 1+2*matchGap, etc.
      nextGameJackpotEligible = nextGameNumber % cashier.matchGap === 0;
    }

    // Count today's jackpot wins from reports
    // const todayJackpotCount = await prisma.report.count({
    //   where: {
    //     cashierId,
    //     date: {
    //       gte: today,
    //       lt: tomorrow,
    //     },
    //     jackpotAwarded: true,
    //   },
    // });
    const todayJackpotCount = 0;
    const remainingJackpots = Math.max(
      0,
      cashier.dailyNumber - todayJackpotCount
    );

    return NextResponse.json({
      jackpotSettings: {
        enabled: cashier.jackpotEnabled === "On",
        percent: cashier.jackpotPercent,
        startingAmount: cashier.jackpotStartingAmount,
        matchGap: cashier.matchGap,
        dailyNumber: cashier.dailyNumber,
      },
      todayStats: {
        todayGamesCount,
        nextGameNumber,
        jackpotsAwarded: todayJackpotCount,
        remainingJackpots,
        nextGameEligible: nextGameJackpotEligible,
      },
      nextGame: {
        number: nextGameNumber,
        jackpotEligible: nextGameJackpotEligible,
        explanation: `Game ${nextGameNumber} % ${cashier.matchGap} = ${
          nextGameNumber % cashier.matchGap
        } ${nextGameNumber % cashier.matchGap === 0 ? "✓" : "✗"}`,
      },
    });
  } catch (error) {
    console.error("Error getting jackpot info:", error);
    return NextResponse.json(
      { error: "Failed to get jackpot info" },
      { status: 500 }
    );
  }
}
