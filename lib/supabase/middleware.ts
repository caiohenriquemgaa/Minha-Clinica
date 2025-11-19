import type { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        response.cookies.set({ name, value, ...options })
      },
      remove: (name: string, options: CookieOptions) => {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  })
}
