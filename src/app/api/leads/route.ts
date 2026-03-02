import { NextResponse } from 'next/server';
import { CONSENT_TEXT, CONSENT_TEXT_VERSION } from '@/lib/consent';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { leadCreateSchema } from '@/lib/validation';
import { getClientIp, toNullableString } from '@/lib/utils';
import { runEnrichmentForLead } from '@/lib/enrichment';

const DEDUPE_WINDOW_HOURS = 24;

export async function POST(request: Request) {
  const parsed = leadCreateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request payload' }, { status: 400 });
  }

  const input = parsed.data;
  const supabase = getSupabaseAdmin();
  const dedupeSince = new Date(Date.now() - DEDUPE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data: duplicateRows } = await supabase
    .from('leads')
    .select('id')
    .or(`email.eq.${input.email},phone.eq.${input.phone}`)
    .gte('created_at', dedupeSince)
    .limit(1);

  const ipAddress = getClientIp(request.headers);
  const leadId = duplicateRows?.[0]?.id ?? null;

  let finalLeadId = leadId;

  if (!finalLeadId) {
    const { data, error } = await supabase.rpc('create_lead_with_consent', {
      p_lead: {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        best_time_to_contact: input.best_time_to_contact,
        street_address: input.street_address,
        city: input.city,
        state: input.state,
        zip: input.zip,
        homeowner_status: input.homeowner_status,
        monthly_electric_bill_range: input.monthly_electric_bill_range,
        roof_shade: input.roof_shade,
        timeline_to_install: input.timeline_to_install
      },
      p_consent: {
        consent_contact: input.consent_contact,
        consent_privacy: input.consent_privacy,
        consent_text_version: CONSENT_TEXT_VERSION,
        consent_text_rendered: CONSENT_TEXT,
        consent_timestamp: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: toNullableString(request.headers.get('user-agent')),
        landing_page_url: input.landing_page_url,
        referrer_url: input.referrer_url,
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        utm_term: input.utm_term,
        utm_content: input.utm_content
      }
    });

    if (error || !data) {
      return NextResponse.json({ error: 'Could not create lead' }, { status: 500 });
    }

    finalLeadId = data as string;
  } else {
    await supabase.from('lead_consent_events').insert({
      lead_id: finalLeadId,
      consent_contact: input.consent_contact,
      consent_privacy: input.consent_privacy,
      consent_text_version: CONSENT_TEXT_VERSION,
      consent_text_rendered: CONSENT_TEXT,
      consent_timestamp: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: toNullableString(request.headers.get('user-agent')),
      landing_page_url: input.landing_page_url,
      referrer_url: input.referrer_url,
      utm_source: input.utm_source,
      utm_medium: input.utm_medium,
      utm_campaign: input.utm_campaign,
      utm_term: input.utm_term,
      utm_content: input.utm_content
    });
  }

  void runEnrichmentForLead(finalLeadId).catch(() => {
    // Enrichment failures are non-blocking for lead intake.
  });

  return NextResponse.json({ lead_id: finalLeadId, deduped: Boolean(leadId) }, { status: 201 });
}
