import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("admin_session")?.value;
  const { pathname } = request.nextUrl;

  // Protect all /admin routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      // Rewrite to /not-found to simulate a 404 Not Found error page
      const notFoundUrl = new URL("/not-found", request.url);
      return NextResponse.rewrite(notFoundUrl);
    }
  }

  // Rewrite /login directly to 404 since it is disabled
  if (pathname === "/login") {
    const notFoundUrl = new URL("/not-found", request.url);
    return NextResponse.rewrite(notFoundUrl);
  }

  // Redirect logged-in users away from secret login to /admin
  if (pathname === "/masuk-admin-rahasia") {
    if (session) {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

// Config to specify which paths this middleware runs on
export const config = {
  matcher: ["/admin/:path*", "/login", "/masuk-admin-rahasia"],
};
