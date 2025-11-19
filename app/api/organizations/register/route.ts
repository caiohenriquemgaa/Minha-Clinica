import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const payload = await request.json()
  const { clinicName, phone, email, ownerName } = payload

  if (!clinicName || !phone) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  const adminClient = createSupabaseAdminClient()

  const { data: organization, error: orgError } = await adminClient
    .from("organizations")
    .insert({
      name: clinicName,
      contact_email: email ?? user.email,
      contact_phone: phone,
    })
    .select("id")
    .single()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 400 })
  }

  const profilePayload = {
    id: user.id,
    full_name: ownerName ?? user.user_metadata?.full_name ?? "",
    default_organization_id: organization.id,
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(profilePayload)
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  const { error: membershipError } = await adminClient.from("organization_members").upsert({
    organization_id: organization.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  })

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 400 })
  }

  return NextResponse.json({ organizationId: organization.id })
}
