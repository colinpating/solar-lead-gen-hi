import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { runEnrichmentForLead } from '@/lib/enrichment';

export async function POST(request: Request, context: { params: Promise<{ leadId: string }> }) {
  const token = request.headers.get('x-internal-token');
  if (token !== env.internalEnrichToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { leadId } = await context.params;

  if (!leadId) {
    return NextResponse.json({ error: 'Missing lead id' }, { status: 400 });
  }

  await runEnrichmentForLead(leadId);
  return NextResponse.json({ ok: true });
}
