import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require auth
const PUBLIC_PATHS = new Set<string>(["/login", "/_next", "/favicon.ico"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and login
  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/api/health") ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ss_token")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon\\.ico|icons|images|api/health).*)",
  ],
};

