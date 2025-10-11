const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export function hasSupabaseAuthConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export function hasSupabaseAdminConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
}

export function getSupabaseAdminCredentials() {
  if (!hasSupabaseAdminConfig()) {
    return null
  }

  return {
    url: SUPABASE_URL as string,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY as string,
  }
}

