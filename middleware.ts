import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createSupabaseMiddlewareClient } from "./lib/supabase/middleware"
import { isMasterAdmin } from "./lib/master-admin"

const protectedRoutes = [
  "/dashboard",
  "/patients",
  "/procedures",
  "/anamnesis",
  "/calendar",
  "/professionals",
  "/equipment",
  "/settings",
  "/sessions",
  "/admin",
]

const publicRoutes = ["/", "/login", "/register", "/trial-expired"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()
  const supabase = createSupabaseMiddlewareClient(request, response)

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith("/admin")

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (isAdminRoute && session) {
    const isMaster = isMasterAdmin(session.user.email)
    if (!isMaster) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  if (session) {
    const { data: membership } = await supabase
      .from("v_user_memberships")
      .select("plan_status")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle()

    if (membership?.plan_status === "blocked" && !pathname.startsWith("/trial-expired")) {
      return NextResponse.redirect(new URL("/trial-expired", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
