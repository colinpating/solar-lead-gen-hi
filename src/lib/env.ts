function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  },
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL');
  },
  get supabaseAnonKey() {
    return required('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY');
  },
  get adminAccessToken() {
    return required('ADMIN_ACCESS_TOKEN');
  },
  get internalEnrichToken() {
    return required('INTERNAL_ENRICH_TOKEN');
  },
  get keepaliveToken() {
    return process.env.KEEPALIVE_TOKEN;
  },
  get censusApiKey() {
    return process.env.CENSUS_API_KEY;
  },
  get censusAcsYear() {
    return process.env.CENSUS_ACS_YEAR ?? '2023';
  },
  get rentcastApiKey() {
    return process.env.RENTCAST_API_KEY;
  }
};
