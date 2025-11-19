import { createClient } from "@supabase/supabase-js"

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE

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
