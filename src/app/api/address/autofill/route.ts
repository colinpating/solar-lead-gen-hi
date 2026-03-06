import { NextResponse } from 'next/server';

type AutofillRequest = {
  street_address?: string;
};

type CensusMatch = {
  matchedAddress?: string;
  addressComponents?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  geographies?: {
    States?: Array<{ STUSAB?: string }>;
  };
};

function cleanZip(zip: string | null | undefined): string | null {
  if (!zip) return null;
  const digits = zip.replace(/\D/g, '');
  return digits.length >= 5 ? digits.slice(0, 5) : null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AutofillRequest | null;
  const streetAddress = body?.street_address?.trim();

  if (!streetAddress || streetAddress.length < 6) {
    return NextResponse.json({ ok: false, reason: 'not_found' as const });
  }

  const endpoint = new URL('https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress');
  endpoint.searchParams.set('address', streetAddress);
  endpoint.searchParams.set('benchmark', 'Public_AR_Current');
  endpoint.searchParams.set('vintage', 'Current_Current');
  endpoint.searchParams.set('format', 'json');

  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ ok: false, reason: 'error' as const });
    }

    const data = (await response.json()) as {
      result?: { addressMatches?: CensusMatch[] };
    };
    const top = data.result?.addressMatches?.[0];
    if (!top) {
      return NextResponse.json({ ok: false, reason: 'not_found' as const });
    }

    const stateCode =
      top?.addressComponents?.state ??
      top?.geographies?.States?.[0]?.STUSAB ??
      top?.matchedAddress?.split(',')?.[2]?.trim()?.split(' ')?.[0] ??
      null;

    if (stateCode !== 'HI') {
      return NextResponse.json({ ok: false, reason: 'non_hi' as const });
    }

    const city = top?.addressComponents?.city ?? null;
    const zip = cleanZip(top?.addressComponents?.zip);
    if (!city || !zip) {
      return NextResponse.json({ ok: false, reason: 'not_found' as const });
    }

    return NextResponse.json({
      ok: true as const,
      city,
      state: 'HI' as const,
      zip
    });
  } catch {
    return NextResponse.json({ ok: false, reason: 'error' as const });
  }
}
