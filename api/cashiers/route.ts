// app/api/agent/cashiers/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
          OR: [
            { phone: { contains: search } },
            { name: { contains: search } },
          ],
        }
      : {}),
  };

  const [cashiers, totalCount] = await Promise.all([
    prisma.cashier.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = payload.id as number;

  const data = await req.json();

  try {
    const cashier = await prisma.cashier.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: data.password, // Consider hashing this
        agentId: agentId,        // Dynamically from JWT
      },
    });
    return NextResponse.json(cashier);
  } catch (error) {
    return NextResponse.json(
      { error: "Cashier creation failed" },
      { status: 400 }
    );
  }
}
