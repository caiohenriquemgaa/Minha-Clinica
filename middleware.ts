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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("middleware_timeout")), timeoutMs)),
  ])
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith("/admin")
  const isAuthRoute = pathname === "/login" || pathname === "/register"

  // Evita chamadas ao Supabase em rotas públicas que não precisam de sessão.
  if (!isProtectedRoute && !isAuthRoute) {
    return response
  }

  const supabase = createSupabaseMiddlewareClient(request, response)

  let session: any = null
  try {
    const sessionResponse = await withTimeout(supabase.auth.getSession(), 2500)
    session = sessionResponse.data.session
  } catch {
    // Se a consulta de sessão falhar/timeout, não bloqueia rotas públicas.
    if (!isProtectedRoute) {
      return response
    }
  }

  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (isAdminRoute && session) {
    const isMaster = isMasterAdmin(session.user.email)
    if (!isMaster) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
