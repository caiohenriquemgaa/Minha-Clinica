export type DataSourceMode = "mock" | "supabase"

const envDataSource = (process.env.NEXT_PUBLIC_DATA_SOURCE as DataSourceMode | undefined) ?? "mock"
const hasSupabaseCredentials = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

const resolvedMode: DataSourceMode =
  envDataSource === "supabase" && hasSupabaseCredentials ? "supabase" : "mock"

export const dataSourceMode: DataSourceMode = resolvedMode

export const isSupabaseEnabled = () => dataSourceMode === "supabase"

export const dataSourceLabel: Record<DataSourceMode, string> = {
  mock: "Mock local (padrão)",
  supabase: "Supabase",
}

export function assertSupabaseEnabled() {
  if (!hasSupabaseCredentials) {
    throw new Error("Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }
}
