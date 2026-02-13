// Google Calendar API integration utilities
export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
}

export interface CalendarSyncSettings {
  enabled: boolean
  calendarId: string
  syncDirection: "both" | "to_google" | "from_google"
  autoSync: boolean
  lastSyncAt?: string
}

// Mock Google Calendar API functions (replace with actual Google Calendar API)
export async function authenticateGoogleCalendar(): Promise<boolean> {
  // In a real implementation, this would handle OAuth flow
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000)
  })
}

export async function getGoogleCalendars(): Promise<Array<{ id: string; name: string }>> {
  // Mock calendars - replace with actual Google Calendar API call
  return [
    { id: "primary", name: "Calendário Principal" },
    { id: "estetitech", name: "EstetiTech - Agendamentos" },
  ]
}

export async function syncSessionToGoogle(session: any): Promise<GoogleCalendarEvent> {
  // Convert session to Google Calendar event format
  const event: GoogleCalendarEvent = {
    id: `session-${session.id}`,
    summary: `${session.procedure_name} - ${session.patient_name}`,
    description: `Procedimento: ${session.procedure_name}\nPaciente: ${session.patient_name}\nObservações: ${session.notes || "Nenhuma"}`,
    start: {
      dateTime: session.scheduled_at,
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: new Date(new Date(session.scheduled_at).getTime() + (session.duration || 60) * 60000).toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    attendees: [
      {
        email: session.patient_email || "",
        displayName: session.patient_name,
      },
    ],
  }

  // Mock API call - replace with actual Google Calendar API
  return new Promise((resolve) => {
    setTimeout(() => resolve(event), 500)
  })
}

export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  // Mock deletion - replace with actual Google Calendar API
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 500)
  })
}

export async function syncAllSessions(
  sessions: any[],
  settings: CalendarSyncSettings,
): Promise<{ success: number; errors: number }> {
  let success = 0
  let errors = 0

  for (const session of sessions) {
    try {
      if (settings.syncDirection === "to_google" || settings.syncDirection === "both") {
        await syncSessionToGoogle(session)
        success++
      }
    } catch (error) {
      console.error("Erro ao sincronizar sessão:", error)
      errors++
    }
  }

  return { success, errors }
}
