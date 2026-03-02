import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export const ADMIN_COOKIE_NAME = 'admin_session';

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE_NAME)?.value === env.adminAccessToken;
}

export async function requireAdmin(): Promise<boolean> {
  return isAdminAuthenticated();
}

export function isAdminHeaderAuthorized(headers: Headers): boolean {
  const token = headers.get('x-admin-token') || headers.get('authorization')?.replace('Bearer ', '');
  return token === env.adminAccessToken;
}
