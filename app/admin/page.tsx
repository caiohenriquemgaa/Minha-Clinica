import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { hasMasterAdminSession, isMasterAdmin, MASTER_ADMIN_SESSION_COOKIE } from "@/lib/master-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AdminOrganizationsPanel from "@/components/admin/organization-admin"
import MasterPasswordGate from "@/components/admin/master-password-gate"

export default async function AdminPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  if (!isMasterAdmin(user.email)) {
    redirect("/dashboard")
  }

  const cookieStore = cookies()
  const hasPasswordSession = hasMasterAdminSession(cookieStore.get(MASTER_ADMIN_SESSION_COOKIE)?.value)

  if (!hasPasswordSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <MasterPasswordGate email={user.email ?? ""} />
      </div>
    )
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("organizations")
    .select("id, name, contact_email, contact_phone, plan_status, trial_end_at, created_at, updated_at")
    .order("created_at", { ascending: true })

  const organizations = data ?? []
  const loadError = error?.message

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Master</h1>
        <p className="text-muted-foreground">
          Controle as clínicas cadastradas, gerencie o período de testes e bloqueie acessos quando necessário.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clínicas ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="text-sm text-red-500">Não foi possível carregar as clínicas: {loadError}</p>
          ) : (
            <AdminOrganizationsPanel initialOrganizations={organizations} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
