import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_relay_jwt_secret_key_change_me",
);

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("relay_session");
  const path = request.nextUrl.pathname;

  // Protect specific routes
  const protectedPaths = ["/dashboard", "/onboarding", "/meeting"];
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p));

  if (isProtectedPath) {
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(sessionCookie.value, JWT_SECRET);
    } catch (error) {
      // Invalid or expired token
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect away from auth pages if already logged in
  const authPaths = ["/login", "/signup", "/verify-email"];
  const isAuthPath = authPaths.some(p => path.startsWith(p));
  
  if (isAuthPath && sessionCookie?.value) {
    try {
      await jwtVerify(sessionCookie.value, JWT_SECRET);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
      // If token is invalid, let them stay on the auth page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)"],
};
