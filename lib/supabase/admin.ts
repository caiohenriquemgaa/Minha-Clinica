import { createClient } from "@supabase/supabase-js"

// Padrão: SUPABASE_SERVICE_ROLE_KEY. Fallback temporário para variável legada.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE

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
