// app/api/cashiers/[id]/debt/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload || typeof payload !== "object" || !payload.id || !payload.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cashierId = parseInt((await params).id);
    const userId = payload.id as number;
    const role = (payload.role as string).toUpperCase();

    // Check if user has permission to view this cashier's debt
    if (role === "ADMIN") {
      // Admin can view any cashier's debt
    } else if (role === "AGENT") {
      // Agent can only view their own cashiers' debt
      const cashier = await prisma.cashier.findUnique({
        where: { id: cashierId },
        select: { agentId: true },
      });
      if (!cashier || cashier.agentId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (role === "CASHIER" && userId !== cashierId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
      select: { 
        id: true,
        name: true,
        debtBalance: true,
        walletBalance: true,
        autoLock: true,
        agentPercentage: true,
        agent: {
          select: {
            id: true,
            name: true,
            autoLock: true,
          },
        },
      },
    });

    if (!cashier) {
      return NextResponse.json({ error: 'Cashier not found' }, { status: 404 });
    }

    return NextResponse.json({
      cashierId: cashier.id,
      cashierName: cashier.name,
      debtBalance: cashier.debtBalance || 0,
      walletBalance: cashier.walletBalance || 0,
      autoLock: cashier.autoLock,
      agentPercentage: cashier.agentPercentage,
      agent: {
        id: cashier.agent.id,
        name: cashier.agent.name,
        autoLock: cashier.agent.autoLock,
      },
    });
  } catch (error) {
    console.error('Debt report error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debt information' },
      { status: 500 }
    );
  }
}
