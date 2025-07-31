import { NextRequest, NextResponse } from "next/server";

export function getAuthToken(req: NextRequest) {
  return req.cookies.get("auth_token")?.value || null;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie() {
  const response = NextResponse.next();
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: -1,
  });
  return response;
}
