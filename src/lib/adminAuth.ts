import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export const ADMIN_COOKIE_NAME = 'admin_session';
export function normalizeToken(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return normalizeToken(store.get(ADMIN_COOKIE_NAME)?.value) === normalizeToken(env.adminAccessToken);
}

export async function requireAdmin(): Promise<boolean> {
  return isAdminAuthenticated();
}

export function isAdminHeaderAuthorized(headers: Headers): boolean {
  const token = headers.get('x-admin-token') || headers.get('authorization')?.replace('Bearer ', '');
  return normalizeToken(token) === normalizeToken(env.adminAccessToken);
}
