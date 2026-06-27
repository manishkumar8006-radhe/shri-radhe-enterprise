import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')?.value;

  // अगर लॉगिन नहीं है तो redirect करो login page पर
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/employees/:path*',
    '/attendance',
    '/payroll',
    '/settings',
    '/performance',
    '/recruitment',
    // और भी secure pages add कर सकते हो
  ],
};
