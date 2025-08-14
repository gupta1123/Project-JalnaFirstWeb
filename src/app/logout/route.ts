import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  // Clear auth cookie
  res.cookies.set("ss_token", "", { maxAge: 0, path: "/" });
  return res;
}

