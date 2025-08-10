// app/api/agents/[id]/debt/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (
      !payload ||
      typeof payload !== "object" ||
      !payload.id ||
      !payload.role
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = parseInt((await params).id);
    const userId = payload.id as number;
    const role = (payload.role as string).toUpperCase();

    // Check if user has permission to view this agent's debt
    if (role === "ADMIN") {
      // Admin can view any agent's debt
    } else if (role === "AGENT" && userId !== agentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (role === "CASHIER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        debtBalance: true,
        walletBalance: true,
        autoLock: true,
        adminPercentage: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({
      agentId: agent.id,
      agentName: agent.name,
      debtBalance: agent.debtBalance || 0,
      walletBalance: agent.walletBalance || 0,
      autoLock: agent.autoLock,
      adminPercentage: agent.adminPercentage,
    });
  } catch (error) {
    console.error("Debt report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debt information" },
      { status: 500 }
    );
  }
}
