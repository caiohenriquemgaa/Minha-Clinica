import { createSupabaseBrowserClient } from "./supabase/browser"

export interface MembershipStatus {
  organization_id: string
  organization_name: string
  plan_status: "trial" | "active" | "blocked"
  trial_end_at: string
  role: string
}

export async function getCurrentMembership() {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("get_current_membership")
  if (error) {
    throw new Error(error.message)
  }
  return data as MembershipStatus | null
}
