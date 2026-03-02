import { env } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type GeocodeResult = {
  lat: number | null;
  lng: number | null;
  geoid: string | null;
  countyName: string | null;
  raw: unknown;
};

async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const endpoint = new URL('https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress');
  endpoint.searchParams.set('address', address);
  endpoint.searchParams.set('benchmark', 'Public_AR_Current');
  endpoint.searchParams.set('vintage', 'Current_Current');
  endpoint.searchParams.set('format', 'json');

  const response = await fetch(endpoint, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Census geocode failed: ${response.status}`);
  }

  const data = (await response.json()) as any;
  const matches = data?.result?.addressMatches ?? [];
  if (!matches.length) {
    return { lat: null, lng: null, geoid: null, countyName: null, raw: data };
  }

  const top = matches[0];
  const tractGeo = top?.geographies?.['Census Tracts']?.[0];
  const county = top?.geographies?.Counties?.[0];

  return {
    lat: top?.coordinates?.y ?? null,
    lng: top?.coordinates?.x ?? null,
    geoid: tractGeo?.GEOID ?? null,
    countyName: county?.NAME ?? null,
    raw: data
  };
}

async function getTractMedianHomeValue(geoid: string | null): Promise<number | null> {
  if (!geoid || geoid.length < 11) return null;

  const state = geoid.slice(0, 2);
  const county = geoid.slice(2, 5);
  const tract = geoid.slice(5);

  const endpoint = new URL(`https://api.census.gov/data/${env.censusAcsYear}/acs/acs5`);
  endpoint.searchParams.set('get', 'B25077_001E');
  endpoint.searchParams.set('for', `tract:${tract}`);
  endpoint.searchParams.set('in', `state:${state} county:${county}`);
  if (env.censusApiKey) {
    endpoint.searchParams.set('key', env.censusApiKey);
  }

  const response = await fetch(endpoint, { cache: 'no-store' });
  if (!response.ok) return null;

  const data = (await response.json()) as string[][];
  if (!Array.isArray(data) || data.length < 2) return null;

  const estimate = Number.parseInt(data[1][0], 10);
  return Number.isFinite(estimate) ? estimate : null;
}

async function lookupHonoluluParcel(_address: string): Promise<{ propertyType: string | null; lastSaleDate: string | null; raw: unknown }> {
  return {
    propertyType: null,
    lastSaleDate: null,
    raw: { provider: 'honolulu_adapter_v1', status: 'not_configured' }
  };
}

export async function runEnrichmentForLead(leadId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, street_address, city, state, zip')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    throw new Error('Lead not found for enrichment');
  }

  const address = `${lead.street_address}, ${lead.city}, ${lead.state} ${lead.zip}`;

  let enrichmentStatus: 'pending' | 'complete' | 'partial' | 'failed' = 'pending';
  let geocodeRaw: unknown = null;
  let parcelRaw: unknown = null;

  try {
    const geocode = await geocodeAddress(address);
    geocodeRaw = geocode.raw;

    if (!geocode.geoid) {
      enrichmentStatus = 'failed';
      await supabase.from('lead_enrichment').upsert({
        lead_id: leadId,
        lat: geocode.lat,
        lng: geocode.lng,
        census_tract: null,
        county: geocode.countyName,
        property_type: null,
        last_sale_date: null,
        home_value_estimate: null,
        home_value_estimate_method: null,
        enrichment_status: enrichmentStatus,
        raw_payload: { geocode: geocodeRaw }
      });
      return;
    }

    const [homeValueEstimate, parcel] = await Promise.all([
      getTractMedianHomeValue(geocode.geoid),
      geocode.countyName?.toLowerCase().includes('honolulu') ? lookupHonoluluParcel(address) : Promise.resolve({ propertyType: null, lastSaleDate: null, raw: { status: 'county_not_supported' } })
    ]);

    parcelRaw = parcel.raw;

    enrichmentStatus = homeValueEstimate ? 'complete' : 'partial';

    await supabase.from('lead_enrichment').upsert({
      lead_id: leadId,
      lat: geocode.lat,
      lng: geocode.lng,
      census_tract: geocode.geoid,
      county: geocode.countyName,
      property_type: parcel.propertyType,
      last_sale_date: parcel.lastSaleDate,
      home_value_estimate: homeValueEstimate,
      home_value_estimate_method: homeValueEstimate ? 'census_tract_median_v1' : null,
      enrichment_status: enrichmentStatus,
      raw_payload: { geocode: geocodeRaw, parcel: parcelRaw, acs_year: env.censusAcsYear }
    });
  } catch (error) {
    await supabase.from('lead_enrichment').upsert({
      lead_id: leadId,
      enrichment_status: 'failed',
      raw_payload: {
        error: error instanceof Error ? error.message : 'Unknown enrichment error',
        geocode: geocodeRaw,
        parcel: parcelRaw
      }
    });
  }
}
