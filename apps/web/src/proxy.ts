import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("relay_session");
  const path = request.nextUrl.pathname;

  // Protect specific routes
  const isGuestMeeting = path.startsWith('/meeting') && path.includes('/guest');
  const protectedPaths = ["/dashboard", "/onboarding", "/meeting"];
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p));

  if (isProtectedPath && !isGuestMeeting) {
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
      await jwtVerify(sessionCookie.value, new TextEncoder().encode(JWT_SECRET));
    } catch {
      // Invalid or expired token
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect away from auth pages if already logged in
  const authPaths = ["/login", "/signup", "/verify-email"];
  const isAuthPath = authPaths.some(p => path.startsWith(p));
  
  if (isAuthPath && sessionCookie?.value) {
    try {
      if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
      await jwtVerify(sessionCookie.value, new TextEncoder().encode(JWT_SECRET));
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // If token is invalid, let them stay on the auth page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)"],
};
