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
- Optional: `KEEPALIVE_TOKEN` (recommended for protecting `/api/health`)
- Optional: `CENSUS_API_KEY`
- Optional: `CENSUS_ACS_YEAR` (default `2023`)

## Key Routes
- `/` landing page + form
- `/privacy` privacy policy
- `/terms` terms page
- `/thank-you` submit success page
- `/api/leads` create lead + consent event
- `/api/enrich/:leadId` internal enrichment endpoint (requires `x-internal-token`)
- `/api/health` keepalive + healthcheck endpoint (optionally protected by `x-keepalive-token` or `?token=`)
- `/admin/login` admin login (token based)
- `/admin/leads` admin lead table
- `/api/admin/leads` JSON list API (auth required)
- `/api/admin/leads/export.csv` CSV export (auth required)

## Keeping Supabase Warm on the Free Tier
If you want to reduce the odds of a free Supabase project pausing from inactivity, you can ping the app periodically.

1. Set `NEXT_PUBLIC_APP_URL` to your deployed app URL.
2. Set `KEEPALIVE_TOKEN` to a random secret.
3. Hit the health endpoint on a schedule, for example:
   - `curl -fsS -H "x-keepalive-token: $KEEPALIVE_TOKEN" "$NEXT_PUBLIC_APP_URL/api/health"`
4. Run that every few hours from a cron service or OpenClaw cron job.

This is a workaround, not a hard guarantee. If Supabase changes free-tier pause behavior, upgrading is still the real fix.

## Notes
- Home value output is a tract-level proxy, not an address-level AVM/Zestimate.
- This implementation is an engineering baseline and not legal advice.
