// app/api/cashiers/[id]/topup/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
import {
  calculateWalletIncrease,
  calculateDebtFirstPayment,
  generateWalletMessage,
  validateWalletDeduction,
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
    if (!payload || typeof payload !== "object" || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = payload.id as number;
    const data = await request.json();
    const { amount } = data;

    if (!amount || typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { error: "Invalid amount. Cannot be zero." },
        { status: 400 }
      );
    }

    const cashierId = parseInt((await params).id);

    // Check if cashier exists and belongs to this agent, and get their percentage
    const cashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
      include: {
        agent: {
          select: {
            id: true,
            walletBalance: true,
            debtBalance: true,
            autoLock: true,
          },
        },
      },
    });

    if (!cashier || cashier.agentId !== agentId) {
      return NextResponse.json({ error: "Cashier not found" }, { status: 404 });
    }

    const isReduction = amount < 0;
    const operationType = isReduction ? "reduction" : "topup";

    if (isReduction) {
      // For reductions, use exact amount logic
      const reductionAmount = Math.abs(amount);

      console.log(
        `Agent reduction calculation: exact amount=${reductionAmount}, cashier wallet will decrease by exactly ${reductionAmount}`
      );

      // Check if cashier has sufficient balance for reduction
      if (cashier.walletBalance < reductionAmount) {
        return NextResponse.json(
          {
            error: `Insufficient cashier wallet balance. Current balance: $${cashier.walletBalance.toFixed(
              2
            )}, cannot reduce by $${reductionAmount.toFixed(2)}`,
          },
          { status: 400 }
        );
      }

      // Calculate how much the agent should get back based on their percentage
      const agentReturnAmount =
        reductionAmount * (cashier.agentPercentage / 100);

      console.log(
        `Cashier reduction: cashier wallet decreases by ${reductionAmount}, agent wallet increases by ${agentReturnAmount} (${cashier.agentPercentage}% of reduction)`
      );

      // Update cashier and agent wallets
      const result = await prisma.$transaction(async (tx) => {
        const updatedCashier = await tx.cashier.update({
          where: { id: cashierId },
          data: {
            walletBalance: {
              decrement: reductionAmount,
            },
          },
        });

        const updatedAgent = await tx.agent.update({
          where: { id: agentId },
          data: {
            walletBalance: {
              increment: agentReturnAmount,
            },
          },
        });

        return { cashier: updatedCashier, agent: updatedAgent };
      });

      return NextResponse.json({
        message: `Wallet reduction successful: Cashier wallet decreased by $${reductionAmount.toFixed(
          2
        )}, agent wallet increased by $${agentReturnAmount.toFixed(2)}`,
        ...result,
        calculationDetails: {
          agentInput: amount,
          agentPercentage: cashier.agentPercentage,
          cashierWalletDecrease: reductionAmount,
          agentWalletIncrease: agentReturnAmount,
          formula: `Agent Return = ${reductionAmount} × (${
            cashier.agentPercentage
          } / 100) = ${agentReturnAmount.toFixed(2)}`,
          operationType: "reduction",
        },
      });
    } else {
      // For top-ups, use percentage-based logic (existing code)
      const calculation = calculateWalletIncrease(
        amount,
        cashier.agentPercentage
      );

      console.log(
        `Agent topup calculation: amount=${amount}, agentPercentage=${cashier.agentPercentage}%, cashierWalletIncrease=${calculation.calculatedIncrease}`
      );

      // Check if agent has sufficient balance for the deduction
      const agent = cashier.agent;
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      const validation = validateWalletDeduction(
        agent.walletBalance,
        amount,
        agent.autoLock
      );

      if (!validation.isValid) {
        if (agent.autoLock) {
          return NextResponse.json(
            { error: validation.error },
            { status: 400 }
          );
        } else {
          // Allow top-up but increase agent debt
          const result = await prisma.$transaction(async (tx) => {
            // Update cashier wallet with the calculated increase
            const updatedCashier = await tx.cashier.update({
              where: { id: cashierId },
              data: {
                walletBalance: {
                  increment: calculation.calculatedIncrease,
                },
              },
            });

            // Update agent - deduct from wallet and increase debt
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
            message:
              "Wallet topped up successfully with debt-first payment (agent debt increased)",
            ...result,
            calculationDetails: {
              agentInput: amount,
              agentPercentage: cashier.agentPercentage,
              cashierWalletIncrease: calculation.calculatedIncrease,
              formula: calculation.formula,
              agentDebtIncrease: amount - agent.walletBalance,
            },
          });
        }
      }

      // Implement debt-first payment system for cashier
      const debtFirstResult = calculateDebtFirstPayment(
        calculation.calculatedIncrease,
        cashier.debtBalance,
        cashier.walletBalance
      );

      console.log(
        `Cashier topup - Final cashier state: newWallet=${debtFirstResult.newWalletBalance}, newDebt=${debtFirstResult.newDebtBalance}`
      );

      // Agent has sufficient funds
      const result = await prisma.$transaction(async (tx) => {
        const updatedCashier = await tx.cashier.update({
          where: { id: cashierId },
          data: {
            walletBalance: debtFirstResult.newWalletBalance,
            debtBalance: debtFirstResult.newDebtBalance,
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

      // Generate informative message
      const message = generateWalletMessage(
        "Top-up",
        debtFirstResult.debtPaid,
        debtFirstResult.walletAdded
      );

      return NextResponse.json({
        message,
        ...result,
        debtPaid: debtFirstResult.debtPaid,
        walletAdded: debtFirstResult.walletAdded,
        calculationDetails: {
          agentInput: amount,
          agentPercentage: cashier.agentPercentage,
          cashierWalletIncrease: calculation.calculatedIncrease,
          formula: calculation.formula,
          agentWalletDeduction: amount,
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
