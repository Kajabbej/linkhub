import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("admin_session")?.value;
  const { pathname } = request.nextUrl;

  // Protect all /admin routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      // Redirect to login if no session cookie exists
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from /login to /admin
  if (pathname === "/login") {
    if (session) {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

// Config to specify which paths this middleware runs on
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
