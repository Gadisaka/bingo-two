import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cashierId = parseInt(params.id);
  if (isNaN(cashierId)) {
    return NextResponse.json({ error: "Invalid cashier ID" }, { status: 400 });
  }

  try {
    const cashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
      select: {
        id: true,
        jackpotEnabled: true,
        jackpotPercent: true,
        jackpotStartingAmount: true,
        matchGap: true,
        dailyNumber: true,
        isClaimed: true,
      },
    });

    if (!cashier) {
      return NextResponse.json({ error: "Cashier not found" }, { status: 404 });
    }

    return NextResponse.json(cashier);
  } catch (error) {
    console.error("Error fetching jackpot settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch jackpot settings" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cashierId = parseInt(params.id);
  if (isNaN(cashierId)) {
    return NextResponse.json({ error: "Invalid cashier ID" }, { status: 400 });
  }

  try {
    const data = await req.json();

    // Validate the data
    const {
      jackpotEnabled,
      jackpotPercent,
      jackpotStartingAmount,
      matchGap,
      dailyNumber,
      isClaimed,
    } = data;

    // Validate jackpotPercent
    if (
      jackpotPercent !== undefined &&
      (jackpotPercent < 1 || jackpotPercent > 100)
    ) {
      return NextResponse.json(
        { error: "Jackpot percent must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Validate jackpotStartingAmount
    if (jackpotStartingAmount !== undefined && jackpotStartingAmount < 1) {
      return NextResponse.json(
        { error: "Jackpot starting amount must be at least 1" },
        { status: 400 }
      );
    }

    // Validate matchGap
    if (matchGap !== undefined && matchGap < 1) {
      return NextResponse.json(
        { error: "Match gap must be at least 1" },
        { status: 400 }
      );
    }

    // Validate dailyNumber
    if (dailyNumber !== undefined && (dailyNumber < 1 || dailyNumber > 75)) {
      return NextResponse.json(
        { error: "Daily number must be between 1 and 75" },
        { status: 400 }
      );
    }

    // Update the cashier's jackpot settings
    const updatedCashier = await prisma.cashier.update({
      where: { id: cashierId },
      data: {
        jackpotEnabled: jackpotEnabled,
        jackpotPercent: jackpotPercent,
        jackpotStartingAmount: jackpotStartingAmount,
        matchGap: matchGap,
        dailyNumber: dailyNumber,
        isClaimed: isClaimed,
      },
      select: {
        id: true,
        jackpotEnabled: true,
        jackpotPercent: true,
        jackpotStartingAmount: true,
        matchGap: true,
        dailyNumber: true,
        isClaimed: true,
      },
    });

    return NextResponse.json(updatedCashier);
  } catch (error) {
    console.error("Error updating jackpot settings:", error);
    return NextResponse.json(
      { error: "Failed to update jackpot settings" },
      { status: 500 }
    );
  }
}
