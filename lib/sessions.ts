import { isSupabaseEnabled } from "./data-source"
import { readStorage, writeStorage } from "./storage"
import { getSupabaseBrowserClient } from "./supabase-client"
import { adjustEquipmentStock, getEquipmentById } from "./equipment"

export interface Session {
  id: string
  patientId: string
  patientName: string
  patientPhone?: string
  procedureId: string
  procedureName: string
  scheduledDate: string
  durationMinutes: number
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled"
  notes?: string
  price: number
  professionalId?: string
  professionalName?: string
  professionalSpecialty?: string
  room?: string
  anamnesisTemplateId?: string
  equipmentUsed?: SessionMaterialUsage[]
  googleCalendarEventId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SessionMaterialUsage {
  id: string
  equipmentId: string
  equipmentName: string
  quantity: number
  recordedAt: string
}

export interface SessionFormData {
  patientId: string
  patientName?: string
  procedureId: string
  procedureName?: string
  scheduledDate: string
  notes?: string
  price?: number
  durationMinutes?: number
  professionalId?: string
  professionalName?: string
  professionalSpecialty?: string
  room?: string
  anamnesisTemplateId?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: Session["status"]
  patientName: string
  procedureName: string
  price: number
}

export interface TimeSlot {
  time: string
  available: boolean
  session?: Session
}

const SESSIONS_STORAGE_KEY = "jmestetica-sessions"

type SupabaseSessionStatus = "agendado" | "confirmado" | "em_andamento" | "concluido" | "cancelado"

const supabaseToAppStatus: Record<SupabaseSessionStatus, Session["status"]> = {
  agendado: "scheduled",
  confirmado: "confirmed",
  em_andamento: "in_progress",
  concluido: "completed",
  cancelado: "cancelled",
}

const appToSupabaseStatus: Record<Session["status"], SupabaseSessionStatus> = {
  scheduled: "agendado",
  confirmed: "confirmado",
  in_progress: "em_andamento",
  completed: "concluido",
  cancelled: "cancelado",
}

type SupabaseSessionRow = {
  id: string
  patient_id: string
  procedure_id: string | null
  scheduled_date: string
  duration_minutes: number | null
  status: SupabaseSessionStatus
  notes: string | null
  price: number | null
  professional_id: string | null
  professional_name: string | null
  professional_specialty: string | null
  room: string | null
  google_calendar_event_id?: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  patients?: {
    id: string
    name: string
    phone?: string | null
  } | null
  procedures?: {
    id: string
    name: string
    duration_minutes?: number | null
  } | null
}

const SUPABASE_SESSION_SELECT = `
  id,
  patient_id,
  procedure_id,
  scheduled_date,
  duration_minutes,
  status,
  notes,
  price,
  professional_id,
  professional_name,
  professional_specialty,
  room,
  google_calendar_event_id,
  created_by,
  created_at,
  updated_at,
  patients:patient_id (
    id,
    name,
    phone
  ),
  procedures:procedure_id (
    id,
    name,
    duration_minutes
  )
`

function mapSupabaseSession(row: SupabaseSessionRow): Session {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patients?.name || "Paciente",
    patientPhone: row.patients?.phone || undefined,
    procedureId: row.procedure_id || "",
    procedureName: row.procedures?.name || "Procedimento",
    scheduledDate: row.scheduled_date,
    durationMinutes: row.duration_minutes || row.procedures?.duration_minutes || 60,
    status: supabaseToAppStatus[row.status] || "scheduled",
    notes: row.notes || undefined,
    price: typeof row.price === "number" ? Number(row.price) : 0,
    professionalId: row.professional_id || undefined,
    professionalName: row.professional_name || undefined,
    professionalSpecialty: row.professional_specialty || undefined,
    room: row.room || undefined,
    googleCalendarEventId: row.google_calendar_event_id || undefined,
    createdBy: row.created_by || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function fetchSupabaseSessionsList(filter?: (query: any) => any): Promise<Session[]> {
  const supabase = getSupabaseBrowserClient()
  let query: any = supabase.from("sessions").select(SUPABASE_SESSION_SELECT)
  if (filter) {
    query = filter(query)
  }
  query = query.order("scheduled_date", { ascending: true })
  const { data, error } = await query
  if (error) {
    throw new Error(`Erro ao buscar sessões: ${error.message}`)
  }
  return (data as SupabaseSessionRow[]).map(mapSupabaseSession)
}

async function fetchSupabaseSessionSingle(filter: (query: any) => any): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient()
  let query: any = supabase.from("sessions").select(SUPABASE_SESSION_SELECT)
  query = filter(query)
  const { data, error } = await query.maybeSingle()
  const typedData = data as SupabaseSessionRow | null
  if (error && error.code !== "PGRST116") {
    throw new Error(`Erro ao buscar sessão: ${error.message}`)
  }
  if (!data) {
    return null
  }
  return mapSupabaseSession(typedData as SupabaseSessionRow)
}
const today = new Date()

function buildDate(daysFromToday: number, hour: number, minute: number) {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysFromToday, hour, minute)
  return date.toISOString()
}

// Mock sessions data
const mockSessions: Session[] = []

const useSupabase = isSupabaseEnabled()

function loadLocalSessions(): Session[] {
  return readStorage<Session[]>(SESSIONS_STORAGE_KEY, mockSessions)
}

function saveLocalSessions(data: Session[]) {
  writeStorage(SESSIONS_STORAGE_KEY, data)
}

// API functions
export async function getSessions(): Promise<Session[]> {
  if (useSupabase) {
    return fetchSupabaseSessionsList()
  }
  await new Promise((resolve) => setTimeout(resolve, 200))
  return loadLocalSessions()
}

export async function getSession(id: string): Promise<Session | null> {
  if (useSupabase) {
    return fetchSupabaseSessionSingle((query) => query.eq("id", id))
  }
  await new Promise((resolve) => setTimeout(resolve, 200))
  return loadLocalSessions().find((session) => session.id === id) || null
}

export async function getSessionsByDate(date: string): Promise<Session[]> {
  if (useSupabase) {
    const selected = new Date(date)
    const dayStart = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate())
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    return fetchSupabaseSessionsList((query) =>
      query.gte("scheduled_date", dayStart.toISOString()).lt("scheduled_date", dayEnd.toISOString()),
    )
  }
  await new Promise((resolve) => setTimeout(resolve, 200))
  const targetDate = new Date(date).toDateString()
  return loadLocalSessions().filter((session) => {
    const sessionDate = new Date(session.scheduledDate).toDateString()
    return sessionDate === targetDate
  })
}

export async function getSessionsByDateRange(startDate: string, endDate: string): Promise<Session[]> {
  if (useSupabase) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startBoundary = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const endBoundary = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
    return fetchSupabaseSessionsList((query) =>
      query.gte("scheduled_date", startBoundary.toISOString()).lt("scheduled_date", endBoundary.toISOString()),
    )
  }
  await new Promise((resolve) => setTimeout(resolve, 200))
  const start = new Date(startDate)
  const end = new Date(endDate)

  return loadLocalSessions().filter((session) => {
    const sessionDate = new Date(session.scheduledDate)
    return sessionDate >= start && sessionDate <= end
  })
}

export async function createSession(data: SessionFormData): Promise<Session> {
  if (useSupabase) {
    const supabase = getSupabaseBrowserClient()
    const payload = {
      patient_id: data.patientId,
      procedure_id: data.procedureId,
      scheduled_date: data.scheduledDate,
      duration_minutes: data.durationMinutes ?? 60,
      status: appToSupabaseStatus["scheduled"],
      notes: data.notes || null,
      price: data.price ?? null,
      professional_id: data.professionalId || null,
      professional_name: data.professionalName || null,
      professional_specialty: data.professionalSpecialty || null,
      room: data.room || null,
    }

    const { data: inserted, error } = await supabase
      .from("sessions")
      .insert([payload])
      .select(SUPABASE_SESSION_SELECT)
      .single()

    if (error) {
      throw new Error(`Erro ao criar sessão: ${error.message}`)
    }

    return mapSupabaseSession((inserted as unknown) as SupabaseSessionRow)
  }

  await new Promise((resolve) => setTimeout(resolve, 300))

  const sessions = loadLocalSessions()
  const now = new Date().toISOString()
  const newSession: Session = {
    id: crypto.randomUUID(),
    patientId: data.patientId,
    patientName: data.patientName || "Paciente",
    procedureId: data.procedureId,
    procedureName: data.procedureName || "Procedimento",
    scheduledDate: data.scheduledDate,
    durationMinutes: data.durationMinutes ?? 60,
    status: "scheduled",
    notes: data.notes,
    price: data.price || 0,
    professionalId: data.professionalId,
    professionalName: data.professionalName,
    professionalSpecialty: data.professionalSpecialty,
    room: data.room,
    anamnesisTemplateId: data.anamnesisTemplateId,
    equipmentUsed: [],
    createdBy: "1",
    createdAt: now,
    updatedAt: now,
  }

  sessions.push(newSession)
  saveLocalSessions(sessions)
  return newSession
}

export async function updateSession(id: string, data: Partial<Session>): Promise<Session> {
  if (useSupabase) {
    const supabase = getSupabaseBrowserClient()
    const payload: Record<string, any> = {}

    if (data.patientId !== undefined) payload.patient_id = data.patientId
    if (data.procedureId !== undefined) payload.procedure_id = data.procedureId
    if (data.scheduledDate !== undefined) payload.scheduled_date = data.scheduledDate
    if (data.durationMinutes !== undefined) payload.duration_minutes = data.durationMinutes
    if (data.status !== undefined) payload.status = appToSupabaseStatus[data.status]
    if (data.notes !== undefined) payload.notes = data.notes
    if (data.price !== undefined) payload.price = data.price
    if (data.professionalId !== undefined) payload.professional_id = data.professionalId
    if (data.professionalName !== undefined) payload.professional_name = data.professionalName
    if (data.professionalSpecialty !== undefined) payload.professional_specialty = data.professionalSpecialty
    if (data.room !== undefined) payload.room = data.room

    const { data: updated, error } = await supabase
      .from("sessions")
      .update(payload)
      .eq("id", id)
      .select(SUPABASE_SESSION_SELECT)
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar sessão: ${error.message}`)
    }

    return mapSupabaseSession((updated as unknown) as SupabaseSessionRow)
  }

  await new Promise((resolve) => setTimeout(resolve, 300))
  const sessions = loadLocalSessions()
  const sessionIndex = sessions.findIndex((session) => session.id === id)
  if (sessionIndex === -1) {
    throw new Error("Sessão não encontrada")
  }

  sessions[sessionIndex] = {
    ...sessions[sessionIndex],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  saveLocalSessions(sessions)
  return sessions[sessionIndex]
}

export async function deleteSession(id: string): Promise<void> {
  if (useSupabase) {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from("sessions").delete().eq("id", id)
    if (error) {
      throw new Error(`Erro ao excluir sessão: ${error.message}`)
    }
    return
  }
  await new Promise((resolve) => setTimeout(resolve, 200))
  const sessions = loadLocalSessions()
  const updated = sessions.filter((session) => session.id !== id)
  if (updated.length === sessions.length) {
    throw new Error("Sessão não encontrada")
  }
  saveLocalSessions(updated)
}

export async function logSessionMaterialUsage(
  sessionId: string,
  equipmentId: string,
  quantity: number,
): Promise<Session> {
  if (useSupabase) {
    throw new Error("Registro de materiais só está disponível no modo local atualmente.")
  }

  if (quantity <= 0) {
    throw new Error("Quantidade precisa ser maior que zero.")
  }

  const sessions = loadLocalSessions()
  const index = sessions.findIndex((session) => session.id === sessionId)
  if (index === -1) throw new Error("Sessão não encontrada")

  const equipment = await getEquipmentById(equipmentId)
  const usage: SessionMaterialUsage = {
    id: crypto.randomUUID(),
    equipmentId,
    equipmentName: equipment?.name || "Equipamento",
    quantity,
    recordedAt: new Date().toISOString(),
  }

  const updatedSession: Session = {
    ...sessions[index],
    equipmentUsed: [...(sessions[index].equipmentUsed || []), usage],
    updatedAt: new Date().toISOString(),
  }

  sessions[index] = updatedSession
  saveLocalSessions(sessions)
  await adjustEquipmentStock(equipmentId, -quantity)

  return updatedSession
}

// Utility functions
export function generateTimeSlots(date: string, existingSessions: Session[]): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startHour = 8 // 8:00 AM
  const endHour = 18 // 6:00 PM
  const slotDuration = 30 // 30 minutes

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      const slotDateTime = new Date(`${date}T${timeString}:00`)

      // Check if this slot conflicts with existing sessions
      const conflictingSession = existingSessions.find((session) => {
        const sessionStart = new Date(session.scheduledDate)
        const sessionEnd = new Date(sessionStart.getTime() + session.durationMinutes * 60000)
        const slotEnd = new Date(slotDateTime.getTime() + slotDuration * 60000)

        return (
          (slotDateTime >= sessionStart && slotDateTime < sessionEnd) ||
          (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
          (slotDateTime <= sessionStart && slotEnd >= sessionEnd)
        )
      })

      slots.push({
        time: timeString,
        available: !conflictingSession,
        session: conflictingSession,
      })
    }
  }

  return slots
}

export function sessionsToCalendarEvents(sessions: Session[]): CalendarEvent[] {
  return sessions.map((session) => {
    const start = new Date(session.scheduledDate)
    const end = new Date(start.getTime() + session.durationMinutes * 60000)

    return {
      id: session.id,
      title: `${session.patientName} - ${session.procedureName}`,
      start,
      end,
      status: session.status,
      patientName: session.patientName,
      procedureName: session.procedureName,
      price: session.price,
    }
  })
}

export function getStatusColor(status: Session["status"]): string {
  switch (status) {
    case "scheduled":
      return "#f59e0b" // amber
    case "confirmed":
      return "#10b981" // emerald
    case "in_progress":
      return "#3b82f6" // blue
    case "completed":
      return "#15803d" // green
    case "cancelled":
      return "#ef4444" // red
    default:
      return "#6b7280" // gray
  }
}

export function getStatusLabel(status: Session["status"]): string {
  switch (status) {
    case "scheduled":
      return "Agendado"
    case "confirmed":
      return "Confirmado"
    case "in_progress":
      return "Em Andamento"
    case "completed":
      return "Concluído"
    case "cancelled":
      return "Cancelado"
    default:
      return "Desconhecido"
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price)
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${minutes}min`
  } else if (remainingMinutes === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${remainingMinutes}min`
  }
}

export function getSessionStats(sessions: Session[]) {
  const total = sessions.length
  const scheduled = sessions.filter((s) => s.status === "scheduled").length
  const confirmed = sessions.filter((s) => s.status === "confirmed").length
  const completed = sessions.filter((s) => s.status === "completed").length
  const cancelled = sessions.filter((s) => s.status === "cancelled").length
  const totalRevenue = sessions.filter((s) => s.status === "completed").reduce((sum, s) => sum + s.price, 0)

  return {
    total,
    scheduled,
    confirmed,
    completed,
    cancelled,
    totalRevenue,
  }
}
