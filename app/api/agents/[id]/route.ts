// app/api/agents/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: parseInt((await params).id) },
      include: {
        admin: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

// app/api/agents/[id]/route.ts (PUT handler)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();

    // Validate adminPercentage range if provided
    if (
      data.adminPercentage !== undefined &&
      (data.adminPercentage < 0 || data.adminPercentage > 100)
    ) {
      return NextResponse.json(
        { error: "Admin percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: parseInt((await params).id) },
      data: {
        name: data.name,
        phone: data.phone,
        walletBalance:
          data.walletBalance !== undefined
            ? Number(data.walletBalance)
            : undefined,
        adminPercentage:
          data.adminPercentage !== undefined
            ? Number(data.adminPercentage)
            : undefined,
        autoLock:
          data.autoLock !== undefined ? Boolean(data.autoLock) : undefined,
        debtBalance:
          data.debtBalance !== undefined ? Number(data.debtBalance) : undefined,
        status: data.status,
      },
    });
    return NextResponse.json(updatedAgent);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 400 }
    );
  }
}
