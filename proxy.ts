import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const clearCookie = (res: NextResponse) => {
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
    return res;
  };

  // Verify JWT token if cookie exists
  let isValidSession = false;
  if (sessionCookie) {
    const payload = await verifyToken(sessionCookie);
    isValidSession = !!payload;
  }

  // Protect all /dashboard routes except /dashboard/login
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    if (!isValidSession) {
      const loginUrl = new URL("/dashboard/login", request.url);
      const res = NextResponse.redirect(loginUrl);
      if (sessionCookie) {
        clearCookie(res);
      }
      return res;
    }
  }

  // If already authenticated and accessing login, redirect directly into dashboard
  if (pathname === "/dashboard/login") {
    if (isValidSession) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    } else if (sessionCookie) {
      // User has a stale/invalid cookie - clear it so browser is clean
      const res = NextResponse.next();
      clearCookie(res);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};
