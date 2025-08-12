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

  console.log("Validating report data:", {
    totalCall,
    registeredNumbers,
    revenue,
    betAmount,
    date,
    status,
    walletDeduction,
    totalCallType: typeof totalCall,
    registeredNumbersType: typeof registeredNumbers,
    revenueType: typeof revenue,
    betAmountType: typeof betAmount,
    walletDeductionType: typeof walletDeduction,
  });

  if (
    typeof totalCall !== "number" ||
    typeof registeredNumbers !== "number" ||
    typeof revenue !== "number" ||
    typeof betAmount !== "number" ||
    !date ||
    (walletDeduction !== undefined && typeof walletDeduction !== "number")
  ) {
    console.error("Validation failed for report data:", {
      totalCallValid: typeof totalCall === "number",
      registeredNumbersValid: typeof registeredNumbers === "number",
      revenueValid: typeof revenue === "number",
      betAmountValid: typeof betAmount === "number",
      dateValid: !!date,
      walletDeductionValid:
        walletDeduction === undefined || typeof walletDeduction === "number",
    });
    return NextResponse.json(
      { error: "Missing or invalid report fields" },
      { status: 400 }
    );
  }

  // Additional validation for numeric values
  if (
    isNaN(totalCall) ||
    isNaN(registeredNumbers) ||
    isNaN(revenue) ||
    isNaN(betAmount) ||
    (walletDeduction !== undefined && isNaN(walletDeduction))
  ) {
    console.error("NaN values detected in report data:", {
      totalCallNaN: isNaN(totalCall),
      registeredNumbersNaN: isNaN(registeredNumbers),
      revenueNaN: isNaN(revenue),
      betAmountNaN: isNaN(betAmount),
      walletDeductionNaN:
        walletDeduction !== undefined && isNaN(walletDeduction),
    });
    return NextResponse.json(
      { error: "Invalid numeric values in report fields" },
      { status: 400 }
    );
  }

  try {
    console.log("Creating report with data:", data);
    console.log("Cashier ID:", cashierId);

    let cashier;
    try {
      cashier = await prisma.cashier.findUnique({
        where: { id: cashierId },
        include: { agent: true, winCutTables: true },
      });
      console.log("Cashier found:", cashier ? "Yes" : "No");
      if (cashier) {
        console.log("Cashier agent:", cashier.agent ? "Yes" : "No");
        console.log(
          "Cashier winCutTables count:",
          cashier.winCutTables?.length || 0
        );
      }
    } catch (dbError) {
      console.error("Database error fetching cashier:", dbError);
      return NextResponse.json(
        { error: "Database error while fetching cashier data" },
        { status: 500 }
      );
    }

    if (!cashier || !cashier.agent) {
      return NextResponse.json(
        { error: "Cashier or Agent not found" },
        { status: 404 }
      );
    }

    // Compute totalBet and winCut percent based on card ranges and bet amount tiers
    const totalBet = registeredNumbers * betAmount;
    const matchedRule = cashier.winCutTables.find(
      (r) => registeredNumbers >= r.minCards && registeredNumbers <= r.maxCards
    );
    const appliedWinCutPercent = matchedRule
      ? betAmount <= 30
        ? matchedRule.percent5to30
        : matchedRule.percentAbove30
      : 0;

    // Validate that revenue represents the win cut amount (should be positive and reasonable)
    if (revenue < 0 || revenue > totalBet) {
      console.warn(
        `Invalid revenue value: ${revenue}. Expected: 0 to ${totalBet}`
      );
    }

    // Compute commissions - Cashier gets win cut, Agent gets percentage of cashier's commission, Admin gets percentage of agent's commission
    // Use the revenue value passed from GameBoard as the cashier commission (win cut amount)
    const cashierCommission = revenue;
    const agentCommission =
      (cashierCommission * (cashier.agentPercentage || 0)) / 100;
    const adminCommission =
      (agentCommission * (cashier.agent.adminPercentage || 0)) / 100;

    console.log("Commission calculations:", {
      totalBet,
      appliedWinCutPercent,
      revenue,
      cashierCommission,
      agentCommission,
      adminCommission,
      cashierAgentPercentage: cashier.agentPercentage,
      adminPercentage: cashier.agent.adminPercentage,
    });

    // Prepare report creation data
    const reportData = {
      totalCall,
      registeredNumbers,
      revenue,
      betAmount,
      totalBet,
      appliedWinCutPercent,
      cashierCommission,
      agentCommission,
      adminCommission,
      date: new Date(date),
      status: status || "ACTIVE",
      cashierId,
    };

    console.log("Report data prepared:", reportData);

    // Wallet balance check logic:
    // - If auto-lock is ON: Game is blocked if balance is insufficient
    // - If auto-lock is OFF: Game is always allowed (debt increases if needed)
    // Check if cashier has sufficient balance for wallet deduction
    if (walletDeduction && walletDeduction > 0) {
      if (cashier.autoLock && cashier.walletBalance < walletDeduction) {
        // Auto-lock is ON and balance is insufficient - block the game
        return NextResponse.json(
          {
            error: "Insufficient cashier wallet balance. Auto-lock is enabled.",
          },
          { status: 400 }
        );
      } else if (cashier.walletBalance < walletDeduction) {
        // Auto-lock is OFF and balance is insufficient - allow game but increase debt
        // No balance restriction when auto-lock is disabled
        try {
          const [report] = await prisma.$transaction([
            prisma.report.create({
              data: reportData,
            }),
            prisma.cashier.update({
              where: { id: cashierId },
              data: {
                walletBalance: 0,
                debtBalance: {
                  increment: walletDeduction - cashier.walletBalance,
                },
              },
            }),
          ]);

          return NextResponse.json(
            {
              report,
              message: "Game started successfully (cashier debt increased)",
            },
            { status: 201 }
          );
        } catch (transactionError) {
          console.error(
            "Transaction failed (insufficient funds):",
            transactionError
          );
          console.error("Transaction error details:", {
            name: transactionError.name,
            message: transactionError.message,
            stack: transactionError.stack,
          });
          return NextResponse.json(
            { error: "Failed to create report and update cashier" },
            { status: 500 }
          );
        }
      } else {
        // Cashier has sufficient funds - proceed normally
        try {
          const [report] = await prisma.$transaction([
            prisma.report.create({
              data: reportData,
            }),
            prisma.cashier.update({
              where: { id: cashierId },
              data: {
                walletBalance: {
                  decrement: walletDeduction,
                },
              },
            }),
          ]);

          return NextResponse.json({ report }, { status: 201 });
        } catch (transactionError) {
          console.error(
            "Transaction failed (sufficient funds):",
            transactionError
          );
          console.error("Transaction error details:", {
            name: transactionError.name,
            message: transactionError.message,
            stack: transactionError.stack,
          });
          return NextResponse.json(
            { error: "Failed to create report and update cashier" },
            { status: 500 }
          );
        }
      }
    } else {
      // No wallet deduction needed
      try {
        const report = await prisma.report.create({
          data: reportData,
        });

        return NextResponse.json({ report }, { status: 201 });
      } catch (createError) {
        console.error(
          "Failed to create report (no wallet deduction):",
          createError
        );
        console.error("Create error details:", {
          name: createError.name,
          message: createError.message,
          stack: createError.stack,
        });
        return NextResponse.json(
          { error: "Failed to create report" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Failed to create report (outer catch):", error);
    console.error("Outer error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  console.log("Reports GET request received");

  // Test database connection first
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection successful");
  } catch (dbError) {
    console.error("Database connection failed:", dbError);
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }

  // Test if Report table exists and has expected structure
  try {
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Report' 
      ORDER BY ordinal_position
    `;
    console.log("Report table structure:", tableInfo);
  } catch (tableError) {
    console.error("Error checking table structure:", tableError);
    // Continue anyway, this is just for debugging
  }

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    console.log("No auth token found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object" || !payload.id || !payload.role) {
    console.log("Invalid auth payload:", payload);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Auth successful for user:", {
    id: payload.id,
    role: payload.role,
  });

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
      { cashier: { phone: { contains: search, mode: "insensitive" } } },
      { cashier: { name: { contains: search, mode: "insensitive" } } },
      {
        cashier: {
          agent: { phone: { contains: search, mode: "insensitive" } },
        },
      },
      {
        cashier: { agent: { name: { contains: search, mode: "insensitive" } } },
      },
    ];
  }

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  if (role === "AGENT") {
    try {
      const cashiers = await prisma.cashier.findMany({
        where: { agentId: userId },
        select: { id: true },
      });
      where.cashierId = { in: cashiers.map((c) => c.id) };
    } catch (dbError) {
      console.error("Database error fetching agent cashiers:", dbError);
      return NextResponse.json(
        { error: "Database error while fetching agent data" },
        { status: 500 }
      );
    }
  } else if (role === "CASHIER") {
    where.cashierId = userId;
  } else if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let totalCount;
  try {
    totalCount = await prisma.report.count({ where });
  } catch (dbError) {
    console.error("Database error counting reports:", dbError);
    return NextResponse.json(
      { error: "Database error while counting reports" },
      { status: 500 }
    );
  }

  let reports;
  try {
    reports = await prisma.report.findMany({
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
  } catch (dbError) {
    console.error("Database error fetching reports:", dbError);
    return NextResponse.json(
      { error: "Database error while fetching reports" },
      { status: 500 }
    );
  }

  let sumFields;
  try {
    // Aggregate without cashierCommission since it doesn't exist in DB yet
    sumFields = await prisma.report.aggregate({
      _sum: {
        totalCall: true,
        registeredNumbers: true,
        revenue: true,
        betAmount: true,
        totalBet: true,
        agentCommission: true,
        adminCommission: true,
      },
      where,
    });
    // Add cashierCommission as 0 since it doesn't exist in DB yet
    sumFields._sum.cashierCommission = 0;
  } catch (error) {
    console.error("Error aggregating reports for sums:", error);
    // Provide default values if aggregation fails
    sumFields = {
      _sum: {
        totalCall: 0,
        registeredNumbers: 0,
        revenue: 0,
        betAmount: 0,
        totalBet: 0,
        cashierCommission: 0,
        agentCommission: 0,
        adminCommission: 0,
      },
    };
  }

  const response = {
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
      totalBet: sumFields._sum.totalBet || 0,
      cashierCommission: sumFields._sum.cashierCommission || 0,
      agentCommission: sumFields._sum.agentCommission || 0,
      adminCommission: sumFields._sum.adminCommission || 0,
    },
  };

  console.log("Reports API response:", {
    reportsCount: reports?.length || 0,
    totalCount,
    sums: response.sums,
  });

  return NextResponse.json(response);
}
