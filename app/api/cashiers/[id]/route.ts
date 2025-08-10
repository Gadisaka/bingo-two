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
      include: {
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
