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

type RentCastResult = {
  propertyType: string | null;
  lastSaleDate: string | null;
  valueEstimate: number | null;
  squareFootage: number | null;
  yearBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSize: number | null;
  raw: unknown;
};

const RENTCAST_MONTHLY_LIMIT = 45; // 50 free/month, leave 5 buffer
let rentcastUsage = { month: '', count: 0 };

function checkRentCastBudget(): boolean {
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-03"
  if (rentcastUsage.month !== currentMonth) {
    rentcastUsage = { month: currentMonth, count: 0 };
  }
  return rentcastUsage.count < RENTCAST_MONTHLY_LIMIT;
}

function incrementRentCastUsage(): void {
  rentcastUsage.count++;
  if (rentcastUsage.count >= 40) {
    console.warn(`[RentCast] ${rentcastUsage.count}/${RENTCAST_MONTHLY_LIMIT} calls used this month`);
  }
}

async function lookupRentCastProperty(address: string): Promise<RentCastResult> {
  const empty: RentCastResult = {
    propertyType: null, lastSaleDate: null, valueEstimate: null,
    squareFootage: null, yearBuilt: null, bedrooms: null, bathrooms: null, lotSize: null, raw: null
  };

  if (!env.rentcastApiKey) {
    return { ...empty, raw: { status: 'no_api_key' } };
  }

  if (!checkRentCastBudget()) {
    console.warn('[RentCast] Monthly call limit reached, skipping API call');
    return { ...empty, raw: { status: 'monthly_limit_reached' } };
  }

  const endpoint = new URL('https://api.rentcast.io/v1/properties');
  endpoint.searchParams.set('address', address);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: { 'X-Api-Key': env.rentcastApiKey, Accept: 'application/json' },
      cache: 'no-store'
    });
  } catch {
    return { ...empty, raw: { status: 'fetch_error' } };
  }

  incrementRentCastUsage();

  if (response.status === 429) {
    return { ...empty, raw: { status: 'rate_limited' } };
  }

  if (!response.ok) {
    return { ...empty, raw: { status: 'error', code: response.status } };
  }

  const data = (await response.json()) as Record<string, unknown>[] | Record<string, unknown>;
  const property = Array.isArray(data) ? data[0] : data;
  if (!property) {
    return { ...empty, raw: { status: 'no_results', data } };
  }

  return {
    propertyType: (property.propertyType as string) ?? null,
    lastSaleDate: (property.lastSaleDate as string) ?? null,
    valueEstimate: typeof property.price === 'number' ? property.price : null,
    squareFootage: typeof property.squareFootage === 'number' ? property.squareFootage : null,
    yearBuilt: typeof property.yearBuilt === 'number' ? property.yearBuilt : null,
    bedrooms: typeof property.bedrooms === 'number' ? property.bedrooms : null,
    bathrooms: typeof property.bathrooms === 'number' ? property.bathrooms : null,
    lotSize: typeof property.lotSize === 'number' ? property.lotSize : null,
    raw: data
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
  let rentcastRaw: unknown = null;

  try {
    const geocode = await geocodeAddress(address);
    geocodeRaw = geocode.raw;

    if (!geocode.geoid) {
      // Geocode failed but still try RentCast for property data
      const rentcast = await lookupRentCastProperty(address);
      rentcastRaw = rentcast.raw;
      const hasRentCastData = !!(rentcast.propertyType || rentcast.valueEstimate || rentcast.squareFootage || rentcast.bedrooms);
      enrichmentStatus = hasRentCastData ? 'partial' : 'failed';
      await supabase.from('lead_enrichment').upsert({
        lead_id: leadId,
        lat: geocode.lat,
        lng: geocode.lng,
        census_tract: null,
        county: geocode.countyName,
        property_type: rentcast.propertyType,
        last_sale_date: rentcast.lastSaleDate,
        home_value_estimate: null,
        home_value_estimate_method: null,
        rentcast_value_estimate: rentcast.valueEstimate,
        square_footage: rentcast.squareFootage,
        year_built: rentcast.yearBuilt,
        bedrooms: rentcast.bedrooms,
        bathrooms: rentcast.bathrooms,
        lot_size: rentcast.lotSize,
        enrichment_status: enrichmentStatus,
        raw_payload: { geocode: geocodeRaw, rentcast: rentcastRaw }
      });
      return;
    }

    const [homeValueEstimate, rentcast] = await Promise.all([
      getTractMedianHomeValue(geocode.geoid),
      lookupRentCastProperty(address)
    ]);

    rentcastRaw = rentcast.raw;

    enrichmentStatus = (homeValueEstimate || rentcast.valueEstimate) ? 'complete' : 'partial';

    await supabase.from('lead_enrichment').upsert({
      lead_id: leadId,
      lat: geocode.lat,
      lng: geocode.lng,
      census_tract: geocode.geoid,
      county: geocode.countyName,
      property_type: rentcast.propertyType,
      last_sale_date: rentcast.lastSaleDate,
      home_value_estimate: homeValueEstimate,
      home_value_estimate_method: homeValueEstimate ? 'census_tract_median_v1' : null,
      rentcast_value_estimate: rentcast.valueEstimate,
      square_footage: rentcast.squareFootage,
      year_built: rentcast.yearBuilt,
      bedrooms: rentcast.bedrooms,
      bathrooms: rentcast.bathrooms,
      lot_size: rentcast.lotSize,
      enrichment_status: enrichmentStatus,
      raw_payload: { geocode: geocodeRaw, rentcast: rentcastRaw, acs_year: env.censusAcsYear }
    });
  } catch (error) {
    await supabase.from('lead_enrichment').upsert({
      lead_id: leadId,
      enrichment_status: 'failed',
      raw_payload: {
        error: error instanceof Error ? error.message : 'Unknown enrichment error',
        geocode: geocodeRaw,
        rentcast: rentcastRaw
      }
    });
  }
}
