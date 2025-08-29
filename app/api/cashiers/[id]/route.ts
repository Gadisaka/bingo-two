// app/api/cashiers/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cashier = await prisma.cashier.findUnique({
      where: { id: parseInt((await params).id) },
      select: {
        id: true,
        name: true,
        phone: true,
        walletBalance: true,
        debtBalance: true,
        agentPercentage: true,
        autoLock: true,
        status: true,
        createdAt: true,
        agentId: true,
        // Jackpot settings
        jackpotEnabled: true,
        jackpotPercent: true,
        jackpotStartingAmount: true,
        matchGap: true,
        dailyNumber: true,
        isClaimed: true,
        agent: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        winCutTables: true,
      },
    });

    if (!cashier) {
      return NextResponse.json({ error: "Cashier not found" }, { status: 404 });
    }

    return NextResponse.json(cashier);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cashier" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload || typeof payload !== "object" || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = payload.id as number;
    const data = await request.json();
    const cashierId = parseInt((await params).id);

    // Check if cashier belongs to this agent
    const existingCashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
      include: { agent: true },
    });

    if (!existingCashier || existingCashier.agentId !== agentId) {
      return NextResponse.json({ error: "Cashier not found" }, { status: 404 });
    }

    // Validate agentPercentage range if provided
    if (
      data.agentPercentage !== undefined &&
      (data.agentPercentage < 0 || data.agentPercentage > 100)
    ) {
      return NextResponse.json(
        { error: "Agent percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate autoLock setting
    if (data.autoLock !== undefined) {
      const autoLock = Boolean(data.autoLock);
      if (!existingCashier.agent.autoLock && autoLock) {
        return NextResponse.json(
          { error: "Cannot set autoLock to true when agent autoLock is false" },
          { status: 400 }
        );
      }
    }

    // Validate jackpot settings if provided
    if (
      data.jackpotPercent !== undefined &&
      (data.jackpotPercent < 1 || data.jackpotPercent > 100)
    ) {
      return NextResponse.json(
        { error: "Jackpot percent must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (
      data.jackpotStartingAmount !== undefined &&
      data.jackpotStartingAmount < 1
    ) {
      return NextResponse.json(
        { error: "Jackpot starting amount must be at least 1" },
        { status: 400 }
      );
    }

    if (data.matchGap !== undefined && data.matchGap < 1) {
      return NextResponse.json(
        { error: "Match gap must be at least 1" },
        { status: 400 }
      );
    }

    if (
      data.dailyNumber !== undefined &&
      (data.dailyNumber < 1 || data.dailyNumber > 75)
    ) {
      return NextResponse.json(
        { error: "Daily number must be between 1 and 75" },
        { status: 400 }
      );
    }

    // Update cashier with transaction to handle winCutTable
    const result = await prisma.$transaction(async (tx) => {
      const updatedCashier = await tx.cashier.update({
        where: { id: cashierId },
        data: {
          name: data.name,
          phone: data.phone,
          walletBalance:
            data.walletBalance !== undefined
              ? Number(data.walletBalance)
              : undefined,
          agentPercentage:
            data.agentPercentage !== undefined
              ? Number(data.agentPercentage)
              : undefined,
          autoLock:
            data.autoLock !== undefined ? Boolean(data.autoLock) : undefined,
          debtBalance:
            data.debtBalance !== undefined
              ? Number(data.debtBalance)
              : undefined,
          status: data.status,
          // Jackpot settings
          jackpotEnabled: data.jackpotEnabled,
          jackpotPercent:
            data.jackpotPercent !== undefined
              ? Number(data.jackpotPercent)
              : undefined,
          jackpotStartingAmount:
            data.jackpotStartingAmount !== undefined
              ? Number(data.jackpotStartingAmount)
              : undefined,
          matchGap:
            data.matchGap !== undefined ? Number(data.matchGap) : undefined,
          dailyNumber:
            data.dailyNumber !== undefined
              ? Number(data.dailyNumber)
              : undefined,
        },
      });

      // Update win cut table if provided
      if (data.winCutTable && Array.isArray(data.winCutTable)) {
        // Delete existing win cut tables
        await tx.winCutTable.deleteMany({
          where: { cashierId: cashierId },
        });

        // Create new win cut table entries
        if (data.winCutTable.length > 0) {
          const winCutTableData = data.winCutTable.map((item: any) => ({
            cashierId: cashierId,
            minCards: Number(item.minCards),
            maxCards: Number(item.maxCards),
            percent5to30: Number(item.percent5to30),
            percentAbove30: Number(item.percentAbove30),
          }));

          await tx.winCutTable.createMany({
            data: winCutTableData,
          });
        }
      }

      return updatedCashier;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cashier update error:", error);

    if (error.code === "P2002" && error.meta?.target?.includes("phone")) {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update cashier" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const cashierId = parseInt((await params).id);

    if (isNaN(cashierId)) {
      return NextResponse.json(
        { error: "Invalid cashier ID" },
        { status: 400 }
      );
    }

    // Check if cashier exists
    const existingCashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
    });

    if (!existingCashier) {
      return NextResponse.json({ error: "Cashier not found" }, { status: 404 });
    }

    // Update only the status field
    const updatedCashier = await prisma.cashier.update({
      where: { id: cashierId },
      data: {
        status: data.isActive ? "ACTIVE" : "INACTIVE",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        agentId: true,
      },
    });

    return NextResponse.json(updatedCashier);
  } catch (error) {
    console.error("Cashier PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update cashier status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cashierId = parseInt((await params).id);

    if (isNaN(cashierId)) {
      return NextResponse.json(
        { error: "Invalid cashier ID" },
        { status: 400 }
      );
    }

    // Check if cashier exists
    const existingCashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
    });

    if (!existingCashier) {
      return NextResponse.json({ error: "Cashier not found" }, { status: 404 });
    }

    // Delete the cashier and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all reports associated with this cashier
      await tx.report.deleteMany({
        where: { cashierId: cashierId },
      });

      // Delete all game sessions (these should already cascade, but being explicit)
      await tx.gameSession.deleteMany({
        where: { cashierId: cashierId },
      });

      // Delete all win cut tables (these should already cascade, but being explicit)
      await tx.winCutTable.deleteMany({
        where: { cashierId: cashierId },
      });

      // Finally, delete the cashier
      await tx.cashier.delete({
        where: { id: cashierId },
      });
    });

    return NextResponse.json({ message: "Cashier deleted successfully" });
  } catch (error) {
    console.error("Cashier DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete cashier" },
      { status: 500 }
    );
  }
}
