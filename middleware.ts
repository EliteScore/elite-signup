import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

export function middleware(req: NextRequest) {
  // No-op: do not interrupt any requests. Matcher above already excludes Next.js assets.
  return NextResponse.next();
}