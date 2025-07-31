import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/cookies";
import { verifyJwt } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: import("next/server").NextRequest) {
  const token = getAuthToken(req);
  const user = token ? verifyJwt(token) : null;

  if (!user) {
    return NextResponse.json({ isAuth: false }, { status: 401 });
  }

  return NextResponse.json({ isAuth: true, user });
}
