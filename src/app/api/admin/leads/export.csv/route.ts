import { NextResponse } from 'next/server';
import { getAllAdminLeadRows } from '@/lib/leadQueries';
import { csvEscape } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip') ?? undefined;
  const lead_status = searchParams.get('lead_status') ?? undefined;
  const homeowner_status = searchParams.get('homeowner_status') ?? undefined;
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  const sortParam = searchParams.get('sort');
  const sort = sortParam === 'created_at_asc' ? 'created_at_asc' : 'created_at_desc';

  const rows = await getAllAdminLeadRows({ zip, lead_status, homeowner_status, from, to, sort });

  const headers = [
    'id',
    'created_at',
    'first_name',
    'last_name',
    'email',
    'phone',
    'best_time_to_contact',
    'street_address',
    'city',
    'state',
    'zip',
    'homeowner_status',
    'monthly_electric_bill_range',
    'roof_shade',
    'timeline_to_install',
    'lead_status',
    'consent_timestamp',
    'consent_contact',
    'consent_privacy',
    'consent_text_version',
    'ip_address',
    'landing_page_url',
    'referrer_url',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'lat',
    'lng',
    'census_tract',
    'county',
    'property_type',
    'last_sale_date',
    'home_value_estimate',
    'home_value_estimate_method',
    'rentcast_value_estimate',
    'square_footage',
    'year_built',
    'bedrooms',
    'bathrooms',
    'lot_size',
    'enrichment_status',
    'enrichment_disclaimer'
  ];

  const lines = [headers.join(',')];

  for (const row of rows) {
    const line = [
      row.id,
      row.created_at,
      row.first_name,
      row.last_name,
      row.email,
      row.phone,
      row.best_time_to_contact,
      row.street_address,
      row.city,
      row.state,
      row.zip,
      row.homeowner_status,
      row.monthly_electric_bill_range,
      row.roof_shade,
      row.timeline_to_install,
      row.lead_status,
      row.consent_timestamp,
      row.consent_contact,
      row.consent_privacy,
      row.consent_text_version,
      row.ip_address,
      row.landing_page_url,
      row.referrer_url,
      row.utm_source,
      row.utm_medium,
      row.utm_campaign,
      row.utm_term,
      row.utm_content,
      row.lat,
      row.lng,
      row.census_tract,
      row.county,
      row.property_type,
      row.last_sale_date,
      row.home_value_estimate,
      row.home_value_estimate_method,
      row.rentcast_value_estimate,
      row.square_footage,
      row.year_built,
      row.bedrooms,
      row.bathrooms,
      row.lot_size,
      row.enrichment_status,
      'home_value_estimate is Census tract median; rentcast_value_estimate is property-level from RentCast.'
    ]
      .map(csvEscape)
      .join(',');

    lines.push(line);
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="hawaii-solar-leads-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
