import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export type LeadRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  best_time_to_contact: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  homeowner_status: string | null;
  monthly_electric_bill_range: string | null;
  roof_shade: string | null;
  timeline_to_install: string | null;
  lead_status: string;
  notes: string | null;
  consent_timestamp: string | null;
  consent_contact: boolean | null;
  consent_privacy: boolean | null;
  consent_text_version: string | null;
  ip_address: string | null;
  user_agent: string | null;
  landing_page_url: string | null;
  referrer_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  lat: number | null;
  lng: number | null;
  census_tract: string | null;
  county: string | null;
  property_type: string | null;
  last_sale_date: string | null;
  home_value_estimate: number | null;
  home_value_estimate_method: string | null;
  enrichment_status: string | null;
  square_footage: number | null;
  year_built: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lot_size: number | null;
  rentcast_value_estimate: number | null;
  enrichment_raw_payload: unknown;
};

type QueryParams = {
  page: number;
  pageSize: number;
  zip?: string;
  lead_status?: string;
  homeowner_status?: string;
  from?: string;
  to?: string;
  sort?: 'created_at_desc' | 'created_at_asc';
};

export async function getAdminLeadRows(params: QueryParams): Promise<{ rows: LeadRow[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize - 1;

  let query = supabase
    .from('admin_lead_rows')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: params.sort === 'created_at_asc' })
    .range(start, end);

  if (params.zip) query = query.eq('zip', params.zip);
  if (params.lead_status) query = query.eq('lead_status', params.lead_status);
  if (params.homeowner_status) query = query.eq('homeowner_status', params.homeowner_status);
  if (params.from) query = query.gte('created_at', params.from);
  if (params.to) query = query.lte('created_at', params.to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    rows: (data ?? []) as LeadRow[],
    total: count ?? 0
  };
}

export async function getAllAdminLeadRows(filters: Omit<QueryParams, 'page' | 'pageSize'>): Promise<LeadRow[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('admin_lead_rows')
    .select('*')
    .order('created_at', { ascending: filters.sort === 'created_at_asc' });

  if (filters.zip) query = query.eq('zip', filters.zip);
  if (filters.lead_status) query = query.eq('lead_status', filters.lead_status);
  if (filters.homeowner_status) query = query.eq('homeowner_status', filters.homeowner_status);
  if (filters.from) query = query.gte('created_at', filters.from);
  if (filters.to) query = query.lte('created_at', filters.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LeadRow[];
}
