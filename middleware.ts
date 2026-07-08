import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createMiddlewareClient({
    req,
    res,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Public routes
  const publicRoutes = ["/login", "/forgot-password"];

  // Not logged in -> Login
  if (!session && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged in -> Login page se dashboard
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/attendance/:path*",
    "/payroll/:path*",
    "/performance/:path*",
    "/recruitment/:path*",
    "/salary_slips/:path*",
    "/login",
    "/forgot-password",
  ],
};