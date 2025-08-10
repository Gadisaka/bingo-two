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

    // Check if agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Implement debt-first payment system
    let remainingAmount = amount;
    let newWalletBalance = agent.walletBalance;
    let newDebtBalance = agent.debtBalance;

    console.log(
      `Agent topup - Initial state: amount=${amount}, currentDebt=${agent.debtBalance}, currentWallet=${agent.walletBalance}`
    );

    // If agent has debt, pay it off first
    if (agent.debtBalance > 0) {
      if (remainingAmount >= agent.debtBalance) {
        // Topup amount can fully pay off the debt
        remainingAmount -= agent.debtBalance;
        newDebtBalance = 0;
        newWalletBalance += remainingAmount;
        console.log(
          `Agent topup - Debt fully paid off: ${agent.debtBalance}, remaining for wallet: ${remainingAmount}`
        );
      } else {
        // Topup amount can only partially pay off the debt
        newDebtBalance -= remainingAmount;
        remainingAmount = 0;
        console.log(
          `Agent topup - Debt partially paid off: ${amount}, remaining debt: ${newDebtBalance}`
        );
      }
    } else {
      // No debt, add all to wallet
      newWalletBalance += remainingAmount;
      console.log(
        `Agent topup - No debt, all amount added to wallet: ${amount}`
      );
    }

    console.log(
      `Agent topup - Final state: newWallet=${newWalletBalance}, newDebt=${newDebtBalance}`
    );

    // Update agent with debt-first payment logic
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        walletBalance: newWalletBalance,
        debtBalance: newDebtBalance,
      },
    });

    // Create informative message based on what happened
    let message = "Wallet topped up successfully";
    if (agent.debtBalance > 0) {
      if (amount >= agent.debtBalance) {
        message = `Debt fully paid off (${agent.debtBalance.toFixed(
          2
        )}) and wallet topped up with remaining amount (${(
          amount - agent.debtBalance
        ).toFixed(2)})`;
      } else {
        message = `Debt partially paid off (${amount.toFixed(
          2
        )}) from total debt (${agent.debtBalance.toFixed(2)})`;
      }
    }

    return NextResponse.json({
      message,
      agent: updatedAgent,
      debtPaid: Math.min(amount, agent.debtBalance),
      walletAdded: Math.max(0, amount - agent.debtBalance),
    });
  } catch (error) {
    console.error("Top-up error:", error);
    return NextResponse.json(
      { error: "Failed to top up wallet" },
      { status: 500 }
    );
  }
}
