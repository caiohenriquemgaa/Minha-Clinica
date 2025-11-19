import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isMasterAdmin } from "@/lib/master-admin"

export async function GET() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ isMaster: false })
  }

  return NextResponse.json({ isMaster: isMasterAdmin(user.email) })
}
