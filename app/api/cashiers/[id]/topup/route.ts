// app/api/cashiers/[id]/topup/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { amount } = data;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    const cashierId = parseInt((await params).id);

    // Check if cashier exists and belongs to this agent
    const cashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
      include: { agent: true },
    });

    if (!cashier || cashier.agentId !== agentId) {
      return NextResponse.json({ error: 'Cashier not found' }, { status: 404 });
    }

    // Check if agent has sufficient balance
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { walletBalance: true, autoLock: true },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if agent has sufficient funds
    if (agent.walletBalance < amount) {
      if (agent.autoLock) {
        return NextResponse.json(
          { error: 'Insufficient agent wallet balance. Auto-lock is enabled.' },
          { status: 400 }
        );
      } else {
        // Allow top-up but increase agent debt
        const result = await prisma.$transaction(async (tx) => {
          const updatedCashier = await tx.cashier.update({
            where: { id: cashierId },
            data: {
              walletBalance: {
                increment: amount,
              },
            },
          });

          const updatedAgent = await tx.agent.update({
            where: { id: agentId },
            data: {
              walletBalance: 0,
              debtBalance: {
                increment: amount - agent.walletBalance,
              },
            },
          });

          return { cashier: updatedCashier, agent: updatedAgent };
        });

        return NextResponse.json({
          message: 'Wallet topped up successfully (agent debt increased)',
          ...result,
        });
      }
    } else {
      // Agent has sufficient funds
      const result = await prisma.$transaction(async (tx) => {
        const updatedCashier = await tx.cashier.update({
          where: { id: cashierId },
          data: {
            walletBalance: {
              increment: amount,
            },
          },
        });

        const updatedAgent = await tx.agent.update({
          where: { id: agentId },
          data: {
            walletBalance: {
              decrement: amount,
            },
          },
        });

        return { cashier: updatedCashier, agent: updatedAgent };
      });

      return NextResponse.json({
        message: 'Wallet topped up successfully',
        ...result,
      });
    }
  } catch (error) {
    console.error('Top-up error:', error);
    return NextResponse.json(
      { error: 'Failed to top up wallet' },
      { status: 500 }
    );
  }
}
