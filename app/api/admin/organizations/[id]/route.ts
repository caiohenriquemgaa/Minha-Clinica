import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { hasMasterAdminSession, isMasterAdmin, MASTER_ADMIN_SESSION_COOKIE } from "@/lib/master-admin"

interface RouteParams {
  params: { id: string }
}

async function requireMasterUser() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isMasterAdmin(user.email)) {
    return { error: "Não autorizado" }
  }

  const cookieStore = cookies()
  if (!hasMasterAdminSession(cookieStore.get(MASTER_ADMIN_SESSION_COOKIE)?.value)) {
    return { error: "Senha master obrigatória" }
  }

  return { user }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { user, error } = await requireMasterUser()
  if (error || !user) {
    return NextResponse.json({ error: error || "Não autorizado" }, { status: 401 })
  }

  const { action, status, days } = await request.json()
  const admin = createSupabaseAdminClient()

  if (action === "set_status") {
    if (!["trial", "active", "blocked"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    const { data, error: updateError } = await admin
      .from("organizations")
      .update({ plan_status: status })
      .eq("id", params.id)
      .select("id, plan_status, trial_end_at, updated_at")
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ organization: data })
  }

  if (action === "extend_trial") {
    if (typeof days !== "number" || Number.isNaN(days)) {
      return NextResponse.json({ error: "Informe a quantidade de dias" }, { status: 400 })
    }

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("trial_end_at")
      .eq("id", params.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: orgError?.message || "Clínica não encontrada" }, { status: 404 })
    }

    const baseDate = org.trial_end_at ? new Date(org.trial_end_at) : new Date()
    const newDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

    const { data, error: updateError } = await admin
      .from("organizations")
      .update({ trial_end_at: newDate.toISOString() })
      .eq("id", params.id)
      .select("id, plan_status, trial_end_at, updated_at")
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ organization: data })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const { user, error } = await requireMasterUser()
  if (error || !user) {
    return NextResponse.json({ error: error || "Não autorizado" }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()
  // Evita violação de FK (profiles.default_organization_id -> organizations.id)
  // antes de remover a organização.
  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({ default_organization_id: null })
    .eq("default_organization_id", params.id)

  if (profileUpdateError) {
    return NextResponse.json({ error: profileUpdateError.message }, { status: 400 })
  }

  const { error: deleteError } = await admin.from("organizations").delete().eq("id", params.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
