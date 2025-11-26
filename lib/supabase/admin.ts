import { createClient } from "@supabase/supabase-js"

// Fallback para SUPABASE_SERVICE_ROLE_KEY (ex.: env da Vercel)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE_KEY

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = serviceRoleKey

  if (!url || !serviceRole) {
    throw new Error("Supabase admin credentials are missing")
  }

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
