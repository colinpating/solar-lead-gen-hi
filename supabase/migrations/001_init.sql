create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  best_time_to_contact text not null,
  street_address text not null,
  city text not null,
  state text not null,
  zip text not null,
  homeowner_status text,
  monthly_electric_bill_range text,
  roof_shade text,
  timeline_to_install text,
  lead_status text not null default 'new',
  notes text
);

create index if not exists idx_leads_created_at on public.leads (created_at desc);
create index if not exists idx_leads_email on public.leads (email);
create index if not exists idx_leads_phone on public.leads (phone);
create index if not exists idx_leads_zip on public.leads (zip);

create table if not exists public.lead_consent_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  consent_contact boolean not null,
  consent_privacy boolean not null,
  consent_text_version text not null,
  consent_text_rendered text not null,
  consent_timestamp timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  landing_page_url text not null,
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text
);

create index if not exists idx_consent_lead_id on public.lead_consent_events (lead_id);
create index if not exists idx_consent_timestamp on public.lead_consent_events (consent_timestamp desc);

create table if not exists public.lead_enrichment (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  lat double precision,
  lng double precision,
  census_tract text,
  county text,
  property_type text,
  last_sale_date date,
  home_value_estimate bigint,
  home_value_estimate_method text,
  enrichment_status text not null default 'pending',
  raw_payload jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_enrichment_lead_id on public.lead_enrichment (lead_id);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.create_lead_with_consent(p_lead jsonb, p_consent jsonb)
returns uuid
language plpgsql
as $$
declare
  v_lead_id uuid;
begin
  insert into public.leads (
    first_name,
    last_name,
    email,
    phone,
    best_time_to_contact,
    street_address,
    city,
    state,
    zip,
    homeowner_status,
    monthly_electric_bill_range,
    roof_shade,
    timeline_to_install
  ) values (
    p_lead->>'first_name',
    p_lead->>'last_name',
    p_lead->>'email',
    p_lead->>'phone',
    p_lead->>'best_time_to_contact',
    p_lead->>'street_address',
    p_lead->>'city',
    p_lead->>'state',
    p_lead->>'zip',
    p_lead->>'homeowner_status',
    p_lead->>'monthly_electric_bill_range',
    p_lead->>'roof_shade',
    p_lead->>'timeline_to_install'
  ) returning id into v_lead_id;

  insert into public.lead_consent_events (
    lead_id,
    consent_contact,
    consent_privacy,
    consent_text_version,
    consent_text_rendered,
    consent_timestamp,
    ip_address,
    user_agent,
    landing_page_url,
    referrer_url,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content
  ) values (
    v_lead_id,
    (p_consent->>'consent_contact')::boolean,
    (p_consent->>'consent_privacy')::boolean,
    p_consent->>'consent_text_version',
    p_consent->>'consent_text_rendered',
    (p_consent->>'consent_timestamp')::timestamptz,
    nullif(p_consent->>'ip_address', '')::inet,
    p_consent->>'user_agent',
    p_consent->>'landing_page_url',
    p_consent->>'referrer_url',
    p_consent->>'utm_source',
    p_consent->>'utm_medium',
    p_consent->>'utm_campaign',
    p_consent->>'utm_term',
    p_consent->>'utm_content'
  );

  insert into public.lead_enrichment (lead_id, enrichment_status)
  values (v_lead_id, 'pending')
  on conflict (lead_id) do nothing;

  return v_lead_id;
end;
$$;

create or replace view public.admin_lead_rows as
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
