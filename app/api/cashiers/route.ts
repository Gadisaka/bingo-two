// app/api/agent/cashiers/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = payload.id as number;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const limit = 10;
  const skip = (page - 1) * limit;

  const where = {
    agentId, // Only get cashiers for this agent
    ...(search
      ? {
          OR: [{ phone: { contains: search } }, { name: { contains: search } }],
        }
      : {}),
  };

  const [cashiers, totalCount] = await Promise.all([
    prisma.cashier.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        walletBalance: true,
        debtBalance: true,
        agentPercentage: true,
        autoLock: true,
        status: true,
        createdAt: true,
        agentId: true,
        // Jackpot settings
        jackpotEnabled: true,
        jackpotPercent: true,
        jackpotStartingAmount: true,
        matchGap: true,
        dailyNumber: true,
        isClaimed: true,
        winCutTables: true,
      },
    }),
    prisma.cashier.count({ where }),
  ]);

  return NextResponse.json({
    cashiers,
    totalPages: Math.ceil(totalCount / limit),
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = payload.id as number;

  const data = await req.json();

  try {
    // Validate required fields
    if (!data.name || !data.phone || !data.password) {
      return NextResponse.json(
        { error: "Missing required fields: name, phone, password" },
        { status: 400 }
      );
    }

    // Validate agentPercentage range
    if (
      data.agentPercentage !== undefined &&
      (data.agentPercentage < 0 || data.agentPercentage > 100)
    ) {
      return NextResponse.json(
        { error: "Agent percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Check if agent exists and get autoLock setting
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { autoLock: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Validate autoLock setting
    const autoLock =
      data.autoLock !== undefined ? Boolean(data.autoLock) : true;
    if (!agent.autoLock && autoLock) {
      return NextResponse.json(
        { error: "Cannot set autoLock to true when agent autoLock is false" },
        { status: 400 }
      );
    }

    // Create cashier with transaction to handle winCutTable
    const result = await prisma.$transaction(async (tx) => {
      const cashier = await tx.cashier.create({
        data: {
          name: data.name,
          phone: data.phone,
          password: data.password, // Consider hashing this
          agentId: agentId,
          walletBalance: Number(data.walletBalance || 0),
          agentPercentage: Number(data.agentPercentage || 0),
          autoLock: autoLock,
          debtBalance: 0,
          // Jackpot settings from form or defaults
          jackpotEnabled: data.jackpotEnabled || "Off",
          jackpotPercent: Number(data.jackpotPercent || 25),
          jackpotStartingAmount: Number(data.jackpotStartingAmount || 200),
          matchGap: Number(data.matchGap || 5),
          dailyNumber: Number(data.dailyNumber || 25),
          isClaimed: false,
        },
      });

      // Create win cut table entries if provided
      if (data.winCutTable && Array.isArray(data.winCutTable)) {
        const winCutTableData = data.winCutTable.map((item: any) => ({
          cashierId: cashier.id,
          minCards: Number(item.minCards),
          maxCards: Number(item.maxCards),
          percent5to30: Number(item.percent5to30),
          percentAbove30: Number(item.percentAbove30),
        }));

        if (winCutTableData.length > 0) {
          await tx.winCutTable.createMany({
            data: winCutTableData,
          });
        }
      }

      return cashier;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cashier creation error:", error);

    if (error.code === "P2002" && error.meta?.target?.includes("phone")) {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Cashier creation failed" },
      { status: 400 }
    );
  }
}
