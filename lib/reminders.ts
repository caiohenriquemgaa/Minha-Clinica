import type { Session } from "./sessions"

export interface ReminderSettings {
  enabled: boolean
  hoursBefore: number
  senderName: string
  channel: "whatsapp"
  defaultMessage?: string
}

export interface ReminderLog {
  sessionId: string
  patientName: string
  patientPhone: string
  scheduledDate: string
  sentAt: string
  channel: "whatsapp"
  professionalName?: string
  messagePreview: string
}

const STORAGE_KEY = "estetitech-reminders"
const LEGACY_STORAGE_KEYS = ["jmestetica-reminders"]
export const defaultReminderSettings: ReminderSettings = {
  enabled: true,
  hoursBefore: 24,
  senderName: "Equipe EstetiTech",
  channel: "whatsapp",
}

export function loadReminderLogs(): ReminderLog[] {
  if (typeof window === "undefined") return []
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as ReminderLog[]

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyStored = window.localStorage.getItem(legacyKey)
      if (!legacyStored) continue
      const parsed = JSON.parse(legacyStored) as ReminderLog[]
      window.localStorage.setItem(STORAGE_KEY, legacyStored)
      return parsed
    }

    return []
  } catch (error) {
    console.warn("Não foi possível carregar o histórico de lembretes:", error)
    return []
  }
}

export function persistReminderLogs(logs: ReminderLog[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch (error) {
    console.warn("Não foi possível salvar o histórico de lembretes:", error)
  }
}

export function getSessionsWithinReminderWindow(
  sessions: Session[],
  hoursBefore: number,
  now = new Date(),
): Session[] {
  const windowInMs = hoursBefore * 60 * 60 * 1000

  return sessions.filter((session) => {
    const sessionDate = new Date(session.scheduledDate)
    const diff = sessionDate.getTime() - now.getTime()
    return diff > 0 && diff <= windowInMs && !!session.patientPhone
  })
}

async function mockWhatsAppSend(session: Session, settings: ReminderSettings): Promise<ReminderLog> {
  const firstName = session.patientName.split(" ")[0]
  const message =
    settings.defaultMessage ||
    `Olá ${firstName}, lembramos que você tem ${session.procedureName} com ${
      session.professionalName || "nossa equipe"
    } amanhã às ${new Date(session.scheduledDate).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}. Qualquer dúvida fale conosco.`

  await new Promise((resolve) => setTimeout(resolve, 400))

  return {
    sessionId: session.id,
    patientName: session.patientName,
    patientPhone: session.patientPhone!,
    scheduledDate: session.scheduledDate,
    sentAt: new Date().toISOString(),
    channel: "whatsapp",
    professionalName: session.professionalName,
    messagePreview: message,
  }
}

export async function processWhatsAppReminders(
  sessions: Session[],
  existingLogs: ReminderLog[],
  settings: ReminderSettings,
  now = new Date(),
): Promise<{ logs: ReminderLog[]; triggered: ReminderLog[]; waiting: number }> {
  if (!settings.enabled) {
    return { logs: existingLogs, triggered: [], waiting: 0 }
  }

  const pendingSessions = getSessionsWithinReminderWindow(sessions, settings.hoursBefore, now)
  const alreadySentIds = new Set(existingLogs.map((log) => log.sessionId))

  const triggered: ReminderLog[] = []
  let logs = [...existingLogs]

  for (const session of pendingSessions) {
    if (alreadySentIds.has(session.id) || !session.patientPhone) continue

    const reminder = await mockWhatsAppSend(session, settings)
    logs = [...logs, reminder]
    triggered.push(reminder)
    alreadySentIds.add(session.id)
  }

  const waiting = pendingSessions.filter((session) => !alreadySentIds.has(session.id)).length

  return { logs, triggered, waiting }
}
