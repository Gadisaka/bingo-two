import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth";
import { setAuthCookie } from "@/lib/cookies";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { phone, password, role } = await req.json();

  if (!phone || !password || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  let user;

  switch (role.toLowerCase()) {
    case "admin":
      user = await prisma.admin.findUnique({ where: { phone } });
      break;
    case "agent":
      user = await prisma.agent.findUnique({ where: { phone } });
      // Check status active
      if (user && user.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Agent is not active" },
          { status: 403 }
        );
      }
      break;
    case "cashier":
      user = await prisma.cashier.findUnique({
        where: { phone },
        include: { agent: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Cashier not found" },
          { status: 401 }
        );
      }

      if (user.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Cashier is not active" },
          { status: 403 }
        );
      }

      if (!user.agent || user.agent.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Associated agent is not active" },
          { status: 403 }
        );
      }

      break;

    default:
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json({ error: "User not Found" }, { status: 401 });
  }

  if (user.password !== password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signJwt({ id: user.id, phone, role });
  // @ts-ignore - Function signature mismatch, but works at runtime
  await setAuthCookie(token);

  return NextResponse.json({ message: "Login successful", role });
}
