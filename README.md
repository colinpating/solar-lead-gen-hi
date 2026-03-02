# Hawaii Residential Solar Lead Gen (MVP)

Next.js + Supabase app for Hawaii solar lead capture with strict consent evidence logging, admin lead table, CSV export, and free Census-based address enrichment.

## Features
- Single-page residential solar landing page with mobile-first lead form.
- Required consent checkboxes for contact + privacy/terms.
- Consent evidence logging: text version, timestamp, IP, user agent, URL, and UTM attribution.
- Dedupe logic for repeated email/phone submissions within 24 hours.
- Admin dashboard (`/admin/leads`) and CSV export (`/api/admin/leads/export.csv`).
- Enrichment pipeline:
  - Census Geocoder (lat/lng + tract)
  - Census ACS tract median home value proxy
  - Honolulu parcel adapter placeholder (non-blocking)

## Stack
- Next.js App Router (TypeScript)
- Supabase Postgres (service-role server access)
- Zod validation

## Setup
1. Install Node.js 20+ and npm.
2. From this directory, install dependencies:
   - `npm install`
3. Copy env file:
   - `copy .env.example .env.local`
4. Fill env values in `.env.local`.
5. Apply SQL migration in Supabase SQL editor:
   - `supabase/migrations/001_init.sql`
6. Run locally:
   - `npm run dev`

## Required Environment Variables
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ACCESS_TOKEN`
- `INTERNAL_ENRICH_TOKEN`
- Optional: `CENSUS_API_KEY`
- Optional: `CENSUS_ACS_YEAR` (default `2023`)

## Key Routes
- `/` landing page + form
- `/privacy` privacy policy
- `/terms` terms page
- `/thank-you` submit success page
- `/api/leads` create lead + consent event
- `/api/enrich/:leadId` internal enrichment endpoint (requires `x-internal-token`)
- `/admin/login` admin login (token based)
- `/admin/leads` admin lead table
- `/api/admin/leads` JSON list API (auth required)
- `/api/admin/leads/export.csv` CSV export (auth required)

## Notes
- Home value output is a tract-level proxy, not an address-level AVM/Zestimate.
- This implementation is an engineering baseline and not legal advice.
