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
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', error: parsed.error.issues[0]?.message ?? 'Invalid request payload' },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const consentAccepted = input.consent_combined;
  const supabase = getSupabaseAdmin();
  const dedupeSince = new Date(Date.now() - DEDUPE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  try {
    const { data: duplicateRows, error: dedupeError } = await supabase
      .from('leads')
      .select('id')
      .or(`email.eq.${input.email},phone.eq.${input.phone}`)
      .gte('created_at', dedupeSince)
      .limit(1);

    if (dedupeError) {
      throw dedupeError;
    }

    const ipAddress = getClientIp(request.headers);
    const leadId = duplicateRows?.[0]?.id ?? null;
    let finalLeadId = leadId;

    const consentPayload = {
      consent_contact: consentAccepted,
      consent_privacy: consentAccepted,
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
    };

    if (!finalLeadId) {
      const { data: rpcLeadId, error: rpcError } = await supabase.rpc('create_lead_with_consent', {
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
        p_consent: consentPayload
      });

      if (!rpcError && rpcLeadId) {
        finalLeadId = rpcLeadId as string;
      } else {
        const { data: insertedLead, error: leadInsertError } = await supabase
          .from('leads')
          .insert({
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
          })
          .select('id')
          .single();

        if (leadInsertError || !insertedLead?.id) {
          console.error('Lead insert fallback failed', {
            rpcError: rpcError?.message,
            leadInsertError: leadInsertError?.message
          });
          return NextResponse.json(
            { code: 'LEAD_CREATE_FAILED', error: 'We could not save your quote right now. Please try again.' },
            { status: 500 }
          );
        }

        finalLeadId = insertedLead.id as string;

        const { error: consentInsertError } = await supabase.from('lead_consent_events').insert({
          lead_id: finalLeadId,
          ...consentPayload
        });

        if (consentInsertError) {
          console.error('Consent insert fallback failed', { consentInsertError: consentInsertError.message });
          return NextResponse.json(
            { code: 'CONSENT_LOG_FAILED', error: 'We could not save your quote right now. Please try again.' },
            { status: 500 }
          );
        }

        const { error: enrichmentSeedError } = await supabase.from('lead_enrichment').upsert(
          {
            lead_id: finalLeadId,
            enrichment_status: 'pending'
          },
          { onConflict: 'lead_id' }
        );

        if (enrichmentSeedError) {
          console.error('Enrichment seed fallback failed', { enrichmentSeedError: enrichmentSeedError.message });
        }
      }
    } else {
      const { error: consentInsertError } = await supabase.from('lead_consent_events').insert({
        lead_id: finalLeadId,
        ...consentPayload
      });

      if (consentInsertError) {
        console.error('Consent insert failed for deduped lead', { consentInsertError: consentInsertError.message });
        return NextResponse.json(
          { code: 'CONSENT_LOG_FAILED', error: 'We could not save your quote right now. Please try again.' },
          { status: 500 }
        );
      }
    }

    if (!finalLeadId) {
      return NextResponse.json(
        { code: 'LEAD_ID_MISSING', error: 'We could not save your quote right now. Please try again.' },
        { status: 500 }
      );
    }

    void runEnrichmentForLead(finalLeadId).catch(() => {
      // Enrichment failures are non-blocking for lead intake.
    });

    return NextResponse.json({ lead_id: finalLeadId, deduped: Boolean(leadId) }, { status: 201 });
  } catch (error) {
    console.error('Lead intake failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { code: 'LEAD_INTAKE_ERROR', error: 'We could not save your quote right now. Please try again.' },
      { status: 500 }
    );
  }
}
