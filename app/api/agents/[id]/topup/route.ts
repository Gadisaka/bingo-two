// app/api/agents/[id]/topup/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
import {
  calculateWalletIncrease,
  calculateDebtFirstPayment,
  generateWalletMessage,
} from "@/lib/wallet-utils";

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

    if (!amount || typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { error: "Invalid amount. Cannot be zero." },
        { status: 400 }
      );
    }

    const agentId = parseInt((await params).id);

    // Check if agent exists and get their percentage
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        walletBalance: true,
        debtBalance: true,
        adminPercentage: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const isReduction = amount < 0;
    const operationType = isReduction ? "reduction" : "topup";

    if (isReduction) {
      // For reductions, use exact amount logic
      const reductionAmount = Math.abs(amount);

      console.log(
        `Admin reduction calculation: exact amount=${reductionAmount}, agent wallet will decrease by exactly ${reductionAmount}`
      );

      // Check if agent has sufficient balance for reduction
      if (agent.walletBalance < reductionAmount) {
        return NextResponse.json(
          {
            error: `Insufficient agent wallet balance. Current balance: $${agent.walletBalance.toFixed(
              2
            )}, cannot reduce by $${reductionAmount.toFixed(2)}`,
          },
          { status: 400 }
        );
      }

      // For admin reductions, the agent wallet decreases by the exact amount
      // No percentage calculation needed for reductions
      console.log(
        `Agent reduction: agent wallet decreases by exactly ${reductionAmount}`
      );

      // Update agent wallet (reduction)
      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          walletBalance: {
            decrement: reductionAmount,
          },
        },
      });

      return NextResponse.json({
        message: `Wallet reduction successful: Agent wallet decreased by $${reductionAmount.toFixed(
          2
        )}`,
        agent: updatedAgent,
        debtPaid: 0,
        walletAdded: -reductionAmount,
        calculationDetails: {
          adminInput: amount,
          adminPercentage: agent.adminPercentage,
          agentWalletDecrease: reductionAmount,
          formula: `Exact Amount Reduction: ${reductionAmount.toFixed(2)}`,
          operationType: "reduction",
        },
      });
    } else {
      // For top-ups, use percentage-based logic (existing code)
      const calculation = calculateWalletIncrease(
        amount,
        agent.adminPercentage
      );

      console.log(
        `Admin topup calculation: amount=${amount}, adminPercentage=${agent.adminPercentage}%, agentWalletIncrease=${calculation.calculatedIncrease}`
      );

      // Implement debt-first payment system
      const debtFirstResult = calculateDebtFirstPayment(
        calculation.calculatedIncrease,
        agent.debtBalance,
        agent.walletBalance
      );

      console.log(
        `Agent topup - Final state: newWallet=${debtFirstResult.newWalletBalance}, newDebt=${debtFirstResult.newDebtBalance}`
      );

      // Update agent with debt-first payment logic
      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          walletBalance: debtFirstResult.newWalletBalance,
          debtBalance: debtFirstResult.newDebtBalance,
        },
      });

      // Generate informative message
      const message = generateWalletMessage(
        "Top-up",
        debtFirstResult.debtPaid,
        debtFirstResult.walletAdded
      );

      return NextResponse.json({
        message,
        agent: updatedAgent,
        debtPaid: debtFirstResult.debtPaid,
        walletAdded: debtFirstResult.walletAdded,
        calculationDetails: {
          adminInput: amount,
          adminPercentage: agent.adminPercentage,
          agentWalletIncrease: calculation.calculatedIncrease,
          formula: calculation.formula,
          operationType: "topup",
        },
      });
    }
  } catch (error) {
    console.error("Top-up error:", error);

    // Handle specific validation errors
    if (
      error instanceof Error &&
      error.message.includes("Invalid percentage")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to process wallet operation" },
      { status: 500 }
    );
  }
}
