import { createSupabaseBrowserClient } from "./supabase/browser"

export interface SignUpPayload {
  ownerName: string
  clinicName: string
  phone: string
  email: string
  password: string
}

export async function signIn(email: string, password: string) {
  const supabase = createSupabaseBrowserClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  const supabase = createSupabaseBrowserClient()
  await supabase.auth.signOut()
}

export async function signUpClinic(payload: SignUpPayload) {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.ownerName,
      },
    },
  })

  if (error) {
    return { user: data.user, error: error.message }
  }

  if (data.user) {
    const response = await fetch("/api/organizations/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        clinicName: payload.clinicName,
        phone: payload.phone,
        email: payload.email,
        ownerName: payload.ownerName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { user: data.user, error: errorData.error || "Não foi possível criar a clínica" }
    }
  }

  return { user: data.user, error: undefined }
}
