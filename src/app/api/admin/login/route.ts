import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { ADMIN_COOKIE_NAME, normalizeToken } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const submittedToken = normalizeToken(body?.token);
  const expectedToken = normalizeToken(env.adminAccessToken);

  if (!submittedToken || submittedToken !== expectedToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, submittedToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  });

  return NextResponse.json({ ok: true });
}
