import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { hasMasterAdminSession, isMasterAdmin, MASTER_ADMIN_SESSION_COOKIE } from "@/lib/master-admin"

export async function GET() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isMasterAdmin(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const cookieStore = cookies()
  if (!hasMasterAdminSession(cookieStore.get(MASTER_ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Senha master obrigatória" }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("organizations")
    .select("id, name, contact_email, contact_phone, plan_status, trial_end_at, created_at, updated_at")
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ organizations: data })
}
