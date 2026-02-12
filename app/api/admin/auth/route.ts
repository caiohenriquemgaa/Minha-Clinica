import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  isMasterAdmin,
  isMasterAdminPasswordValid,
  MASTER_ADMIN_SESSION_COOKIE,
  MASTER_ADMIN_SESSION_VALUE,
} from "@/lib/master-admin"

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isMasterAdmin(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { password } = await request.json()

  if (!isMasterAdminPasswordValid(password)) {
    return NextResponse.json({ error: "Senha master inválida" }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: MASTER_ADMIN_SESSION_COOKIE,
    value: MASTER_ADMIN_SESSION_VALUE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hora
    path: "/",
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: MASTER_ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  })
  return response
}
