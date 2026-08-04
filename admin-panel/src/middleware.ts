import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map for admin routes (IP-based)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ADMIN_ATTEMPTS = 10; // Max attempts per window

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';

  // Secret portal or API protection
  if (pathname.startsWith('/control-portal-784291') || pathname.startsWith('/api/admin')) {
    // Rate Limiting for Admin API endpoints
    if (pathname.startsWith('/api/admin')) {
      const now = Date.now();
      const userLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };

      if (now - userLimit.lastReset > RATE_LIMIT_WINDOW_MS) {
        userLimit.count = 0;
        userLimit.lastReset = now;
      }

      userLimit.count += 1;
      rateLimitMap.set(ip, userLimit);

      if (userLimit.count > MAX_ADMIN_ATTEMPTS) {
        return NextResponse.json(
          { error: 'Çok fazla hatalı veya üst üste istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.' },
          { status: 429 }
        );
      }
    }

    const response = NextResponse.next();

    // Enterprise Security Headers & Anti-Crawler Protections
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/control-portal-784291/:path*', '/api/admin/:path*'],
};
