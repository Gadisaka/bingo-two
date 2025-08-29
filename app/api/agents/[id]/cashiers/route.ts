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

    // Fetch all cashiers for this agent
    const cashiers = await prisma.cashier.findMany({
      where: {
        agentId: agentId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        agentId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cashiers);
  } catch (error) {
    console.error("[AGENT_CASHIERS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch cashiers" },
      { status: 500 }
    );
  }
}
