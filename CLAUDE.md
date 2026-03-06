# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hawaii residential solar lead generation MVP. Next.js 15 App Router (TypeScript) + Supabase Postgres + Zod validation. Hawaii-only (state locked to `HI`, zip validated against Hawaii range).

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check (`tsc --noEmit`)

## Architecture

### Data Flow

1. **Lead intake**: `LeadForm` (client component) → `POST /api/leads` → Supabase `create_lead_with_consent` RPC (atomic insert of lead + consent event + enrichment placeholder)
2. **Dedupe**: Same email or phone within 24h gets a new consent event on the existing lead instead of a new lead row
3. **Enrichment** (fire-and-forget, non-blocking): Census Geocoder → lat/lng + tract GEOID → Census ACS median home value by tract. RentCast API → property-level value, property type, last sale date, sqft, year built, beds/baths (50 free calls/month, degrades gracefully on 429 or missing key).
4. **Admin**: Cookie-based auth via `ADMIN_ACCESS_TOKEN`. Middleware gates `/admin/*` pages and `/api/admin/*` endpoints.

### Database (Supabase)

Four tables + one view, defined in `supabase/migrations/001_init.sql` and `002_rentcast_columns.sql`:
- `leads` — core lead data
- `lead_consent_events` — immutable consent evidence log (one-to-many per lead)
- `lead_enrichment` — geocode/ACS/RentCast property data (one-to-one per lead, upserted)
- `admin_users` — placeholder admin user table
- `admin_lead_rows` — view joining leads + latest consent event + enrichment (used by admin queries)

All DB access uses the Supabase service-role client (`src/lib/supabaseAdmin.ts`). There is no client-side Supabase usage.

### Key Modules

- `src/lib/validation.ts` — Zod schema for lead creation; enforces Hawaii zip range and 10-digit phone
- `src/lib/partners.ts` — marketing partner list (legal names); changes require bumping `CONSENT_TEXT_VERSION`
- `src/lib/consent.ts` — consent text built dynamically from partner list; update `CONSENT_TEXT_VERSION` when consent language or partners change
- `src/lib/enrichment.ts` — Census Geocoder + ACS + RentCast enrichment pipeline
- `src/lib/leadQueries.ts` — admin lead queries against `admin_lead_rows` view with pagination/filtering
- `src/lib/adminAuth.ts` — token-based admin auth helpers; cookie name is `admin_session`
- `src/middleware.ts` — gates admin routes (pages via redirect, API via 401)

### Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_ACCESS_TOKEN`, `INTERNAL_ENRICH_TOKEN`
Optional: `CENSUS_API_KEY`, `CENSUS_ACS_YEAR` (default `2023`), `RENTCAST_API_KEY`

Env validation is in `src/lib/env.ts` — required vars throw at startup if missing.

## Conventions

- All server-side DB access goes through `getSupabaseAdmin()` (service-role key)
- Consent events are append-only; never update or delete consent records
- Enrichment is upserted per lead and must not block the lead creation response
- Admin auth is a single shared token, not per-user authentication
