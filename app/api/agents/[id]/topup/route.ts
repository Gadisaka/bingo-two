// app/api/agents/[id]/topup/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function POST(
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

    // Only admins can top up agent wallets
    if (payload.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const { amount } = data;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    const agentId = parseInt((await params).id);

    // Check if agent exists and get current debt balance
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, walletBalance: true, debtBalance: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Implement debt-first payment logic
    const currentDebt = agent.debtBalance || 0;
    let remainingAmount = amount;
    let newWalletBalance = agent.walletBalance || 0;
    let newDebtBalance = currentDebt;

    if (currentDebt > 0) {
      // First, pay off existing debt
      if (amount >= currentDebt) {
        // Topup amount is sufficient to pay off all debt
        newDebtBalance = 0;
        remainingAmount = amount - currentDebt;
        newWalletBalance += remainingAmount;
      } else {
        // Topup amount is less than debt - pay off partial debt
        newDebtBalance = currentDebt - amount;
        remainingAmount = 0;
      }
    } else {
      // No existing debt - add all topup to wallet
      newWalletBalance += amount;
    }

    // Update agent with new balances
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        walletBalance: newWalletBalance,
        debtBalance: newDebtBalance,
      },
    });

    // Prepare response message based on what happened
    let message = "Wallet topped up successfully";
    if (currentDebt > 0) {
      if (amount >= currentDebt) {
        message = `Debt fully paid off (${currentDebt}) and wallet topped up with remaining amount (${remainingAmount})`;
      } else {
        message = `Partial debt payment (${amount}) applied. Remaining debt: ${newDebtBalance}`;
      }
    }

    return NextResponse.json({
      message,
      agent: updatedAgent,
      debtPaid: Math.min(amount, currentDebt),
      walletAdded: remainingAmount,
    });
  } catch (error) {
    console.error("Top-up error:", error);
    return NextResponse.json(
      { error: "Failed to top up wallet" },
      { status: 500 }
    );
  }
}
