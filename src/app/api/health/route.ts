import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function isAuthorized(request: Request): boolean {
  const configuredToken = env.keepaliveToken;
  if (!configuredToken) return true;

  const headerToken = request.headers.get('x-keepalive-token');
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');

  return headerToken === configuredToken || queryToken === configuredToken;
}

async function checkDatabase() {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('leads').select('id', { head: true, count: 'exact' }).limit(1);

  if (error) {
    throw error;
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await checkDatabase();

    return NextResponse.json({
      ok: true,
      service: 'solar-lead-gen-hi',
      checked_at: new Date().toISOString(),
      database: 'reachable'
    });
  } catch (error) {
    console.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        ok: false,
        service: 'solar-lead-gen-hi',
        checked_at: new Date().toISOString(),
        database: 'unreachable'
      },
      { status: 503 }
    );
  }
}

export async function HEAD(request: Request) {
  const response = await GET(request);
  return new Response(null, {
    status: response.status,
    headers: response.headers
  });
}
