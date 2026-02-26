import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/home", "/search", "/account", "/checkout", "/watch", "/content", "/sport"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/attached_assets/") ||
    pathname.startsWith("/assets/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (!isProtected) {
    return NextResponse.next();
  }

  const cookies = request.cookies;
  const hasAuthCookie = Array.from(cookies.getAll()).some(
    (cookie) =>
      cookie.name.includes("auth-token") ||
      cookie.name.includes("sb-") ||
      cookie.name === "supabase-auth-token"
  );

  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.png).*)",
  ],
};
