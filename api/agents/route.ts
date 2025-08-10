// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // your prisma client instance

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    const pageSize = 10;

    const where = search
      ? {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    // Count total agents matching filter
    // @ts-ignore - Prisma type issue with mode property
    const totalAgents = await prisma.agent.count({ where });

    // Fetch agents with pagination
    // @ts-ignore - Prisma type issue with mode property
    const agents = await prisma.agent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        admin: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      agents,
      totalPages: Math.ceil(totalAgents / pageSize),
      currentPage: page,
    });
  } catch (error) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, password, walletBalance = 0, adminId } = body;

    // Validate required fields
    if (!phone || !name || !password || !adminId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new agent
    const newAgent = await prisma.agent.create({
      data: {
        phone,
        name,
        password, // Consider hashing the password before saving in real app
        walletBalance: Number(walletBalance),
        admin: {
          connect: { id: Number(adminId) },
        },
      },
    });

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error: any) {
    // @ts-ignore - Error type handling
    console.error("POST /api/agents error:", error);

    if (error.code === "P2002" && error.meta?.target?.includes("phone")) {
      // Prisma unique constraint violation for phone field
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
