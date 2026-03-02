import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin') && path !== '/admin/login') {
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!cookie || cookie !== process.env.ADMIN_ACCESS_TOKEN) {
      const login = new URL('/admin/login', request.url);
      return NextResponse.redirect(login);
    }
  }

  if (path.startsWith('/api/admin')) {
    const headerToken =
      request.headers.get('x-admin-token') || request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!headerToken || headerToken !== process.env.ADMIN_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
