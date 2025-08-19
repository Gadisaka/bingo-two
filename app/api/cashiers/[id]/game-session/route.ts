import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get current game session number for a cashier
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

    // Get the last game session for today
    const lastSession = await prisma.gameSession.findFirst({
      where: {
        cashierId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        sessionNumber: "desc",
      },
    });

    const currentSessionNumber = lastSession
      ? lastSession.sessionNumber + 1
      : 1;

    return NextResponse.json({
      currentSessionNumber,
      lastSession: lastSession
        ? {
            id: lastSession.id,
            sessionNumber: lastSession.sessionNumber,
            jackpotEligible: lastSession.jackpotEligible,
            jackpotAwarded: lastSession.jackpotAwarded,
            jackpotAmount: lastSession.jackpotAmount,
          }
        : null,
    });
  } catch (error) {
    console.error("Error getting game session:", error);
    return NextResponse.json(
      { error: "Failed to get game session" },
      { status: 500 }
    );
  }
}

// Create a new game session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cashierId = parseInt(params.id);
    const { totalBet } = await request.json();

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get the last game session for today
    const lastSession = await prisma.gameSession.findFirst({
      where: {
        cashierId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        sessionNumber: "desc",
      },
    });

    const sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;

    // Get cashier's jackpot settings
    const cashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
      select: {
        jackpotEnabled: true,
        jackpotStartingAmount: true,
        matchGap: true,
        dailyNumber: true,
      },
    });

    if (!cashier) {
      return NextResponse.json({ error: "Cashier not found" }, { status: 404 });
    }

    // Check if jackpot should be enabled
    const isJackpotEnabled =
      cashier.jackpotEnabled === "On" &&
      totalBet >= cashier.jackpotStartingAmount;

    // Check if this session should be eligible for jackpot
    let jackpotEligible = false;
    if (isJackpotEnabled) {
      // Check daily jackpot limit
      const todayJackpotCount = await prisma.gameSession.count({
        where: {
          cashierId,
          date: {
            gte: today,
            lt: tomorrow,
          },
          jackpotAwarded: true,
        },
      });

      if (todayJackpotCount < cashier.dailyNumber) {
        // Check if this session number matches the jackpot pattern
        jackpotEligible = sessionNumber % cashier.matchGap === 0;
      }
    }

    // Create the new game session
    const newSession = await prisma.gameSession.create({
      data: {
        cashierId,
        sessionNumber,
        totalBet,
        jackpotEligible,
        date: today,
      },
    });

    return NextResponse.json({
      session: {
        id: newSession.id,
        sessionNumber: newSession.sessionNumber,
        jackpotEligible: newSession.jackpotEligible,
        totalBet: newSession.totalBet,
      },
    });
  } catch (error) {
    console.error("Error creating game session:", error);
    return NextResponse.json(
      { error: "Failed to create game session" },
      { status: 500 }
    );
  }
}

// Update game session (e.g., mark jackpot as awarded)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cashierId = parseInt(params.id);
    const { sessionId, jackpotAmount, status } = await request.json();

    const updatedSession = await prisma.gameSession.update({
      where: {
        id: sessionId,
        cashierId,
      },
      data: {
        jackpotAwarded: jackpotAmount ? true : undefined,
        jackpotAmount,
        status,
      },
    });

    return NextResponse.json({
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating game session:", error);
    return NextResponse.json(
      { error: "Failed to update game session" },
      { status: 500 }
    );
  }
}
