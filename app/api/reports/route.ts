// @ts-nocheck
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id || !payload.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Cashiers can create reports
  if (payload.role.toUpperCase() !== "CASHIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cashierId = payload.id as number;

  // Parse request body
  let data;
  try {
    data = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate required fields in data
  const {
    totalCall,
    registeredNumbers,
    revenue,
    betAmount,
    date,
    status,
    walletDeduction,
  } = data;

  if (
    typeof totalCall !== "number" ||
    typeof registeredNumbers !== "number" ||
    typeof revenue !== "number" ||
    typeof betAmount !== "number" ||
    !date ||
    (walletDeduction !== undefined && typeof walletDeduction !== "number")
  ) {
    return NextResponse.json(
      { error: "Missing or invalid report fields" },
      { status: 400 }
    );
  }

  try {
    const cashier = await prisma.cashier.findUnique({
      where: { id: cashierId },
      include: { agent: true },
    });

    if (!cashier || !cashier.agent) {
      return NextResponse.json(
        { error: "Cashier or Agent not found" },
        { status: 404 }
      );
    }

    // Start transaction
    const [report] = await prisma.$transaction([
      prisma.report.create({
        data: {
          totalCall,
          registeredNumbers,
          revenue,
          betAmount,
          date: new Date(date),
          status: status || "ACTIVE",
          cashierId,
        },
      }),
      ...(walletDeduction && walletDeduction > 0
        ? [
            prisma.agent.update({
              where: { id: cashier.agent.id },
              data: {
                wallet: {
                  decrement: walletDeduction,
                },
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Failed to create report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id || !payload.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.id as number;
  const role = (payload.role as string).toUpperCase();

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const perPage = parseInt(req.nextUrl.searchParams.get("perPage") || "10", 10);
  const search = req.nextUrl.searchParams.get("search") || "";
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  // @ts-ignore - Prisma where clause type issue
  const where: any = {};
  if (search) {
    where.OR = [
      { cashier: { phone: { contains: search } } },
      { cashier: { agent: { phone: { contains: search } } } },
    ];
  }

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  if (role === "AGENT") {
    const cashiers = await prisma.cashier.findMany({
      where: { agentId: userId },
      select: { id: true },
    });
    where.cashierId = { in: cashiers.map((c) => c.id) };
  } else if (role === "CASHIER") {
    where.cashierId = userId;
  } else if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalCount = await prisma.report.count({ where });

  const reports = await prisma.report.findMany({
    where,
    include: {
      cashier: {
        select: {
          id: true,
          phone: true,
          name: true,
          agent: { select: { id: true, phone: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  const sumFields = await prisma.report.aggregate({
    _sum: {
      totalCall: true,
      registeredNumbers: true,
      revenue: true,
      betAmount: true,
    },
    where,
  });

  return NextResponse.json({
    reports,
    pagination: {
      total: totalCount,
      page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    },
    sums: {
      totalCall: sumFields._sum.totalCall || 0,
      registeredNumbers: sumFields._sum.registeredNumbers || 0,
      revenue: sumFields._sum.revenue || 0,
      betAmount: sumFields._sum.betAmount || 0,
    },
  });
}
