-- Drop view first (Postgres cannot reorder view columns in-place)
drop view if exists public.admin_lead_rows;

-- Add RentCast property data columns to lead_enrichment
alter table public.lead_enrichment
  add column if not exists square_footage integer,
  add column if not exists year_built integer,
  add column if not exists bedrooms integer,
  add column if not exists bathrooms numeric(4,1),
  add column if not exists lot_size integer,
  add column if not exists rentcast_value_estimate bigint;

-- Recreate admin_lead_rows view to include new columns
create view public.admin_lead_rows as
select
  l.id,
  l.created_at,
  l.first_name,
  l.last_name,
  l.email,
  l.phone,
  l.best_time_to_contact,
  l.street_address,
  l.city,
  l.state,
  l.zip,
  l.homeowner_status,
  l.monthly_electric_bill_range,
  l.roof_shade,
  l.timeline_to_install,
  l.lead_status,
  l.notes,
  c.consent_timestamp,
  c.consent_contact,
  c.consent_privacy,
  c.consent_text_version,
  c.ip_address,
  c.user_agent,
  c.landing_page_url,
  c.referrer_url,
  c.utm_source,
  c.utm_medium,
  c.utm_campaign,
  c.utm_term,
  c.utm_content,
  e.lat,
  e.lng,
  e.census_tract,
  e.county,
  e.property_type,
  e.last_sale_date,
  e.home_value_estimate,
  e.home_value_estimate_method,
  e.enrichment_status,
  e.square_footage,
  e.year_built,
  e.bedrooms,
  e.bathrooms,
  e.lot_size,
  e.rentcast_value_estimate,
  e.raw_payload as enrichment_raw_payload
from public.leads l
left join lateral (
  select *
  from public.lead_consent_events c
  where c.lead_id = l.id
  order by c.consent_timestamp desc
  limit 1
) c on true
left join public.lead_enrichment e on e.lead_id = l.id;
