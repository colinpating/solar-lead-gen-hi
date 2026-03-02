import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;

  if (!body?.token || body.token !== env.adminAccessToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, body.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  });

  return NextResponse.json({ ok: true });
}
