// app/api/agents/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: parseInt((await params).id) },
      include: {
        admin: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

// app/api/agents/[id]/route.ts (PUT handler)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();

    // Validate adminPercentage range if provided
    if (
      data.adminPercentage !== undefined &&
      (data.adminPercentage < 0 || data.adminPercentage > 100)
    ) {
      return NextResponse.json(
        { error: "Admin percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: parseInt((await params).id) },
      data: {
        name: data.name,
        phone: data.phone,
        walletBalance:
          data.walletBalance !== undefined
            ? Number(data.walletBalance)
            : undefined,
        adminPercentage:
          data.adminPercentage !== undefined
            ? Number(data.adminPercentage)
            : undefined,
        autoLock:
          data.autoLock !== undefined ? Boolean(data.autoLock) : undefined,
        debtBalance:
          data.debtBalance !== undefined ? Number(data.debtBalance) : undefined,
        status: data.status,
      },
    });
    return NextResponse.json(updatedAgent);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("DELETE agent request received");
    const agentId = parseInt((await params).id);
    console.log("Agent ID to delete:", agentId);

    if (isNaN(agentId)) {
      console.log("Invalid agent ID:", (await params).id);
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
    }

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id: agentId },
    });
    console.log("Existing agent found:", !!existingAgent);

    if (!existingAgent) {
      console.log("Agent not found with ID:", agentId);
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Use transaction to delete agent and all associated data
    console.log("Starting deletion transaction");
    await prisma.$transaction(async (tx) => {
      // First, get all cashier IDs for this agent
      const cashierIds = await tx.cashier.findMany({
        where: { agentId: agentId },
        select: { id: true },
      });
      const cashierIdList = cashierIds.map((c) => c.id);
      console.log("Cashier IDs to delete:", cashierIdList);

      if (cashierIdList.length > 0) {
        // Delete all reports for these cashiers first
        const deletedReports = await tx.report.deleteMany({
          where: { cashierId: { in: cashierIdList } },
        });
        console.log("Deleted reports count:", deletedReports.count);

        // WinCutTable and GameSession will be deleted automatically due to CASCADE
      }

      // Then delete all cashiers under this agent
      const deletedCashiers = await tx.cashier.deleteMany({
        where: { agentId: agentId },
      });
      console.log("Deleted cashiers count:", deletedCashiers.count);

      // Finally delete the agent
      const deletedAgent = await tx.agent.delete({
        where: { id: agentId },
      });
      console.log("Deleted agent:", deletedAgent.id);
    });

    console.log("Agent deletion completed successfully");
    return NextResponse.json({
      message: "Agent and all associated cashiers deleted successfully",
    });
  } catch (error) {
    console.error("Agent DELETE error:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          { error: "Cannot delete agent: has dependent records" },
          { status: 409 }
        );
      }
      if (error.message.includes("Record to delete does not exist")) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
    }

    return NextResponse.json(
      {
        error: `Failed to delete agent: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
