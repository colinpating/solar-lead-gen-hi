function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  adminAccessToken: required('ADMIN_ACCESS_TOKEN'),
  internalEnrichToken: required('INTERNAL_ENRICH_TOKEN'),
  censusApiKey: process.env.CENSUS_API_KEY,
  censusAcsYear: process.env.CENSUS_ACS_YEAR ?? '2023'
};
