import { createSupabaseServerClient } from "./supabase/server"

export async function getServerSession() {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
