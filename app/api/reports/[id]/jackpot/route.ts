import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);
    const { jackpotAwarded, jackpotAmount } = await request.json();

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        jackpotAwarded,
        jackpotAmount: jackpotAmount || null,
      },
    });

    return NextResponse.json({
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error updating report with jackpot info:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
