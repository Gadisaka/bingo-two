// app/api/cashiers/[id]/topup/route.ts
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
    if (!payload || typeof payload !== "object" || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = payload.id as number;
    const data = await request.json();
    const { amount } = data;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number." },
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
      return NextResponse.json({ error: "Cashier not found" }, { status: 404 });
    }

    // Check if agent has sufficient balance
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { walletBalance: true, autoLock: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Implement debt-first payment system for cashier
    let remainingAmount = amount;
    let newCashierWalletBalance = cashier.walletBalance;
    let newCashierDebtBalance = cashier.debtBalance;
    let newAgentWalletBalance = agent.walletBalance;
    let newAgentDebtBalance = agent.debtBalance;

    console.log(
      `Cashier topup - Initial state: amount=${amount}, cashierDebt=${cashier.debtBalance}, cashierWallet=${cashier.walletBalance}, agentWallet=${agent.walletBalance}`
    );

    // First, check if cashier has debt and pay it off
    if (cashier.debtBalance > 0) {
      if (remainingAmount >= cashier.debtBalance) {
        // Topup amount can fully pay off the cashier's debt
        remainingAmount -= cashier.debtBalance;
        newCashierDebtBalance = 0;
        newCashierWalletBalance += remainingAmount;
        console.log(
          `Cashier topup - Debt fully paid off: ${cashier.debtBalance}, remaining for wallet: ${remainingAmount}`
        );
      } else {
        // Topup amount can only partially pay off the cashier's debt
        newCashierDebtBalance -= remainingAmount;
        remainingAmount = 0;
        console.log(
          `Cashier topup - Debt partially paid off: ${amount}, remaining debt: ${newCashierDebtBalance}`
        );
      }
    } else {
      // No cashier debt, add all to wallet
      newCashierWalletBalance += remainingAmount;
      console.log(
        `Cashier topup - No debt, all amount added to wallet: ${amount}`
      );
    }

    console.log(
      `Cashier topup - Final cashier state: newWallet=${newCashierWalletBalance}, newDebt=${newCashierDebtBalance}`
    );

    // Now handle agent's wallet/debt for the payment
    if (agent.walletBalance < amount) {
      if (agent.autoLock) {
        return NextResponse.json(
          { error: "Insufficient agent wallet balance. Auto-lock is enabled." },
          { status: 400 }
        );
      } else {
        // Allow top-up but increase agent debt
        const result = await prisma.$transaction(async (tx) => {
          const updatedCashier = await tx.cashier.update({
            where: { id: cashierId },
            data: {
              walletBalance: newCashierWalletBalance,
              debtBalance: newCashierDebtBalance,
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
          message:
            "Wallet topped up successfully with debt-first payment (agent debt increased)",
          ...result,
        });
      }
    } else {
      // Agent has sufficient funds
      const result = await prisma.$transaction(async (tx) => {
        const updatedCashier = await tx.cashier.update({
          where: { id: cashierId },
          data: {
            walletBalance: newCashierWalletBalance,
            debtBalance: newCashierDebtBalance,
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

      // Create informative message based on what happened
      let message = "Wallet topped up successfully";
      if (cashier.debtBalance > 0) {
        if (amount >= cashier.debtBalance) {
          message = `Cashier debt fully paid off (${cashier.debtBalance.toFixed(
            2
          )}) and wallet topped up with remaining amount (${(
            amount - cashier.debtBalance
          ).toFixed(2)})`;
        } else {
          message = `Cashier debt partially paid off (${amount.toFixed(
            2
          )}) from total debt (${cashier.debtBalance.toFixed(2)})`;
        }
      }

      return NextResponse.json({
        message,
        ...result,
        debtPaid: Math.min(amount, cashier.debtBalance),
        walletAdded: Math.max(0, amount - cashier.debtBalance),
      });
    }
  } catch (error) {
    console.error("Top-up error:", error);
    return NextResponse.json(
      { error: "Failed to top up wallet" },
      { status: 500 }
    );
  }
}
