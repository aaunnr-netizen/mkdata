import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("sy_session")?.value;

  // Protect all /dashboard routes except /dashboard/login
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    if (!sessionCookie) {
      const loginUrl = new URL("/dashboard/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and accessing login, redirect directly into dashboard
  if (pathname === "/dashboard/login" && sessionCookie) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};
