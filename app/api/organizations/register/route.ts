import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const payload = await request.json()
  const { clinicName, phone, email, ownerName, userId } = payload

  if (!clinicName || !phone) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  // Tentar obter o usuário pela sessão; se não existir, usar o userId enviado pelo signup
  let ownerId = userId as string | undefined
  let ownerEmail = email as string | undefined
  let ownerNameResolved = ownerName as string | undefined

  if (!ownerId) {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    ownerId = user?.id
    ownerEmail = ownerEmail ?? user?.email ?? undefined
    ownerNameResolved = ownerNameResolved ?? (user?.user_metadata as any)?.full_name ?? ""
  }

  if (!ownerId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const adminClient = createSupabaseAdminClient()

  const { data: organization, error: orgError } = await adminClient
    .from("organizations")
    .insert({
      name: clinicName,
      contact_email: ownerEmail ?? email,
      contact_phone: phone,
    })
    .select("id")
    .single()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 400 })
  }

  const profilePayload = {
    id: ownerId,
    full_name: ownerNameResolved ?? "",
    default_organization_id: organization.id,
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(profilePayload)
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  const { error: membershipError } = await adminClient.from("organization_members").upsert({
    organization_id: organization.id,
    user_id: ownerId,
    role: "owner",
    status: "active",
  })

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 400 })
  }

  return NextResponse.json({ organizationId: organization.id })
}
