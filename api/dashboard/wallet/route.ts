// app/api/dashboard/wallet/route.ts
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

  const userId = payload.id as number;
  const role = (payload.role as string).toUpperCase();

  try {
    if (role === "ADMIN") {
      // For Admin, you can return total wallet value or 0
      // Here, let's just return 0 or you can customize logic
      return NextResponse.json({ wallet: 0 });
    }

    if (role === "AGENT") {
      const agent = await prisma.agent.findUnique({
        where: { id: userId },
        select: { wallet: true },
      });
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
      return NextResponse.json({ wallet: agent.wallet || 0 });
    }

    if (role === "CASHIER") {
      const cashier = await prisma.cashier.findUnique({
        where: { id: userId },
      });
      const agent = await prisma.agent.findUnique({
        where: { id: cashier?.agentId },
      });

      if (!cashier) {
        return NextResponse.json(
          { error: "Cashier not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ wallet: agent?.wallet || 0 });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 403 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
