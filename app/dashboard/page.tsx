"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageCircle,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { getSessions, type Session, getStatusColor, getStatusLabel } from "@/lib/sessions"
import { getProfessionals, type Professional } from "@/lib/professionals"
import {
  defaultReminderSettings,
  loadReminderLogs,
  persistReminderLogs,
  processWhatsAppReminders,
  type ReminderLog,
  type ReminderSettings,
} from "@/lib/reminders"
import { dataSourceLabel, dataSourceMode } from "@/lib/data-source"

const timeLabels = Array.from({ length: 21 }, (_, index) => {
  const minutes = 8 * 60 + index * 30
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
})

const formatDayLong = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(date)

const formatTimeRange = (session: Session) => {
  const start = new Date(session.scheduledDate)
  const end = new Date(start.getTime() + session.durationMinutes * 60000)
  const formatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

const formatDateTime = (dateString: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))

interface DecoratedProfessional extends Professional {
  eventBg: string
  borderClass: string
  dotClass: string
  accentClass: string
}

const colorPalette = [
  { eventBg: "from-[#f8e3ff] to-[#f7d3ff]", borderClass: "border-fuchsia-200", dotClass: "bg-fuchsia-500", accentClass: "text-fuchsia-600" },
  { eventBg: "from-[#fff5d6] to-[#ffe7a3]", borderClass: "border-amber-200", dotClass: "bg-amber-500", accentClass: "text-amber-600" },
  { eventBg: "from-[#dcfce7] to-[#bef5d1]", borderClass: "border-emerald-200", dotClass: "bg-emerald-500", accentClass: "text-emerald-600" },
  { eventBg: "from-[#ffe4e6] to-[#ffcfd5]", borderClass: "border-rose-200", dotClass: "bg-rose-500", accentClass: "text-rose-600" },
  { eventBg: "from-[#dbeafe] to-[#c7ddff]", borderClass: "border-sky-200", dotClass: "bg-sky-500", accentClass: "text-sky-600" },
]

const fallbackPalette = {
  eventBg: "from-slate-50 to-slate-100",
  borderClass: "border-slate-200",
  dotClass: "bg-slate-400",
  accentClass: "text-slate-600",
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [professionals, setProfessionals] = useState<DecoratedProfessional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(
    () => new Set(),
  )
  const [activeProfessionalId, setActiveProfessionalId] = useState("")
  const [scheduleView, setScheduleView] = useState<"board" | "list" | "timeline">("board")
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(defaultReminderSettings)
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([])
  const [recentReminders, setRecentReminders] = useState<ReminderLog[]>([])
  const [waitingReminders, setWaitingReminders] = useState(0)
  const [isProcessingReminder, setIsProcessingReminder] = useState(false)

  const reminderLogsRef = useRef<ReminderLog[]>([])

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true)
      try {
        const data = await getSessions()
        setSessions(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadSessions()
  }, [])

  useEffect(() => {
    const storedLogs = loadReminderLogs()
    setReminderLogs(storedLogs)
    reminderLogsRef.current = storedLogs
  }, [])

  useEffect(() => {
    if (!sessions.length) return
    let isMounted = true

    const runReminders = async () => {
      const result = await processWhatsAppReminders(sessions, reminderLogsRef.current, reminderSettings)
      if (!isMounted) return

      if (result.logs.length !== reminderLogsRef.current.length) {
        reminderLogsRef.current = result.logs
        setReminderLogs(result.logs)
        persistReminderLogs(result.logs)
      }

      if (result.triggered.length) {
        setRecentReminders(result.triggered)
      }
      setWaitingReminders(result.waiting)
    }

    runReminders()

    return () => {
      isMounted = false
    }
  }, [sessions, reminderSettings])

  const daySessions = useMemo(() => {
    return sessions
      .filter((session) => {
        const sameDay = new Date(session.scheduledDate).toDateString() === selectedDate.toDateString()
        return sameDay
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  }, [sessions, selectedDate])

  const decorateProfessionals = useCallback(
    (list: Professional[]): DecoratedProfessional[] =>
      list.map((pro, index) => {
        const palette = colorPalette[index % colorPalette.length]
        return { ...pro, ...palette }
      }),
    [],
  )

  useEffect(() => {
    const load = async () => {
      const data = await getProfessionals()
      setProfessionals(decorateProfessionals(data))
    }
    load()
  }, [decorateProfessionals])

  const extendedProfessionals = useMemo(() => {
    const map = new Map<string, DecoratedProfessional>()
    professionals.forEach((pro) => map.set(pro.id, pro))

    daySessions.forEach((session, index) => {
      if (!session.professionalId) return
      if (map.has(session.professionalId)) return
      const palette = colorPalette[(professionals.length + index) % colorPalette.length] ?? fallbackPalette
      map.set(session.professionalId, {
        id: session.professionalId,
        name: session.professionalName || "Equipe",
        specialty: session.professionalSpecialty || "Equipe",
        phone: "",
        email: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...palette,
      })
    })

    if (!map.size && daySessions.length) {
      // Sem profissionais cadastrados, criar coluna genérica
      map.set("generic", {
        id: "generic",
        name: "Equipe",
        specialty: "Não definido",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...fallbackPalette,
      })
    }

    return Array.from(map.values())
  }, [professionals, daySessions])

  const specialtyOptions = useMemo(() => {
    const entries = new Map<string, DecoratedProfessional>()
    extendedProfessionals.forEach((pro) => {
      const key = pro.specialty || "Outros"
      if (!entries.has(key)) entries.set(key, pro)
    })
    return Array.from(entries.entries()).map(([value, pro]) => ({
      value,
      label: value,
      accent: pro.accentClass,
    }))
  }, [extendedProfessionals])

  useEffect(() => {
    if (specialtyOptions.length && selectedSpecialties.size === 0) {
      setSelectedSpecialties(new Set(specialtyOptions.map((option) => option.value)))
    }
  }, [specialtyOptions, selectedSpecialties.size])

  useEffect(() => {
    if (!extendedProfessionals.length) {
      setActiveProfessionalId("")
      return
    }
    if (!activeProfessionalId || !extendedProfessionals.some((pro) => pro.id === activeProfessionalId)) {
      setActiveProfessionalId(extendedProfessionals[0].id)
    }
  }, [extendedProfessionals, activeProfessionalId])

  const proSessionsMap = useMemo(() => {
    const map: Record<string, Session[]> = {}
    extendedProfessionals.forEach((pro) => {
      map[pro.id] = []
    })

    daySessions.forEach((session) => {
      const targetId = session.professionalId || extendedProfessionals[0]?.id
      if (!targetId) return
      if (!map[targetId]) {
        map[targetId] = []
      }
      map[targetId].push(session)
    })

    Object.values(map).forEach((list) =>
      list.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
    )

    return map
  }, [daySessions, extendedProfessionals])

  const defaultSpecialties = useMemo(() => new Set(specialtyOptions.map((item) => item.value)), [specialtyOptions])

  const activeSpecialties = selectedSpecialties.size > 0 ? selectedSpecialties : defaultSpecialties

  const displayedProfessionals = extendedProfessionals.filter((pro) => activeSpecialties.has(pro.specialty))

  const focusSessions = activeProfessionalId ? proSessionsMap[activeProfessionalId] || [] : []

  const upcomingSessions = useMemo(() => {
    return sessions
      .filter((session) => new Date(session.scheduledDate).getTime() >= Date.now())
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 6)
  }, [sessions])

  const renderBoardView = () => {
    if (!displayedProfessionals.length) {
      return (
        <div className="flex items-center justify-center px-6 py-12 text-sm text-muted-foreground">
          Cadastre profissionais para visualizar a grade diária.
        </div>
      )
    }
    return (
      <div className="flex">
        <div className="hidden w-20 border-r bg-muted/40 text-xs font-semibold text-muted-foreground md:block">
          {timeLabels.map((time) => (
            <div key={time} className="border-b px-2 py-3">
              {time}
            </div>
          ))}
        </div>
        <ScrollArea className="w-full">
          <div className="min-w-[960px]">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${displayedProfessionals.length}, minmax(0, 1fr))` }}>
              {displayedProfessionals.map((pro) => (
                <div key={pro.id} className="border-r last:border-r-0">
                  <div className="border-b bg-muted/30 px-4 py-3">
                    <p className="text-sm font-semibold">{pro.name}</p>
                    <p className="text-[11px] text-muted-foreground">{pro.specialty}</p>
                  </div>
                  <div className="space-y-4 px-3 py-4">
                    {proSessionsMap[pro.id]?.length ? (
                      proSessionsMap[pro.id].map((session) => (
                        <Link key={session.id} href={`/calendar/${session.id}`} className="block" prefetch={false}>
                          <div
                            className={`rounded-xl border px-3 py-3 text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${pro.borderClass} bg-gradient-to-b ${pro.eventBg}`}
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-semibold uppercase tracking-wide">{formatTimeRange(session)}</span>
                              <Badge
                                variant="outline"
                                className="border-none text-[10px] font-semibold"
                                style={{
                                  color: getStatusColor(session.status),
                                  backgroundColor: `${getStatusColor(session.status)}22`,
                                }}
                              >
                                {getStatusLabel(session.status)}
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold text-foreground">{session.procedureName}</p>
                            <p className="text-xs text-muted-foreground">{session.patientName}</p>
                            <p className="text-[11px] text-muted-foreground">Sala {session.room || "Principal"}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-center text-xs text-muted-foreground">Sem atendimentos</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  const renderListView = () => {
    if (!daySessions.length) {
      return <p className="px-6 py-10 text-sm text-muted-foreground">Nenhum atendimento programado para esta data.</p>
    }

    return (
      <div className="divide-y">
        {daySessions.map((session) => (
          <Link key={session.id} href={`/calendar/${session.id}`} className="flex items-center justify-between px-4 py-3" prefetch={false}>
            <div>
              <p className="text-xs uppercase text-muted-foreground">{formatTimeRange(session)}</p>
              <p className="text-sm font-semibold">{session.patientName}</p>
              <p className="text-xs text-muted-foreground">{session.procedureName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{session.professionalName || "Equipe"}</p>
              <Badge variant="outline" style={{ color: getStatusColor(session.status), borderColor: getStatusColor(session.status) }}>
                {getStatusLabel(session.status)}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  const renderTimelineView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b text-muted-foreground">
            <th className="px-4 py-2">Horário</th>
            <th className="px-4 py-2">Profissional</th>
            <th className="px-4 py-2">Paciente</th>
            <th className="px-4 py-2">Procedimento</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {daySessions.length ? (
            daySessions.map((session) => (
              <tr key={session.id} className="border-b hover:bg-muted/40">
                <td className="px-4 py-2">{formatTimeRange(session)}</td>
                <td className="px-4 py-2">{session.professionalName || "Equipe"}</td>
                <td className="px-4 py-2">{session.patientName}</td>
                <td className="px-4 py-2">{session.procedureName}</td>
                <td className="px-4 py-2">
                  <Badge
                    variant="outline"
                    style={{
                      color: getStatusColor(session.status),
                      borderColor: getStatusColor(session.status),
                    }}
                  >
                    {getStatusLabel(session.status)}
                  </Badge>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum atendimento programado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  const renderScheduleContent = () => {
    switch (scheduleView) {
      case "list":
        return renderListView()
      case "timeline":
        return renderTimelineView()
      default:
        return renderBoardView()
    }
  }

  const totalToday = daySessions.length
  const confirmedToday = daySessions.filter((session) => session.status === "confirmed").length
  const pendingToday = daySessions.filter((session) => session.status === "scheduled").length

  const remindersSentToday = useMemo(() => {
    const today = new Date().toDateString()
    return reminderLogs.filter((log) => new Date(log.sentAt).toDateString() === today).length
  }, [reminderLogs])

  const latestReminderLogs = useMemo(() => {
    if (recentReminders.length) {
      return recentReminders.slice(0, 3)
    }
    return reminderLogs.slice(-3)
  }, [recentReminders, reminderLogs])

  const toggleSpecialty = (value: string) => {
    setSelectedSpecialties((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  const handleNavigateDay = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + (direction === "next" ? 1 : -1))
      return next
    })
  }

  const handleResetDate = () => {
    setSelectedDate(new Date())
  }

  const handleManualReminder = async () => {
    if (!reminderSettings.enabled) {
      toast({
        title: "Ative os lembretes",
        description: "Habilite o envio automático para disparar mensagens pelo WhatsApp.",
      })
      return
    }

    setIsProcessingReminder(true)
    try {
      const result = await processWhatsAppReminders(daySessions, reminderLogsRef.current, reminderSettings)
      reminderLogsRef.current = result.logs
      setReminderLogs(result.logs)
      persistReminderLogs(result.logs)
      setRecentReminders(result.triggered)
      setWaitingReminders(result.waiting)

      if (result.triggered.length) {
        toast({
          title: "Lembretes enviados",
          description: `${result.triggered.length} pacientes receberam notificações no WhatsApp.`,
        })
      } else {
        toast({
          title: "Nenhum lembrete enviado",
          description: "Todos os pacientes já foram notificados para este período.",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar lembretes",
        description: "Verifique sua conexão ou as credenciais do WhatsApp Business.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingReminder(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-gradient-to-r from-primary/5 via-fuchsia-50 to-rose-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap items-start gap-6 justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Central de operações</p>
              <h1 className="mt-1 text-3xl font-semibold text-foreground">Agenda inteligente</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Assim que a profissional acessa, ela visualiza toda a programação do dia, confirmações pendentes e o
                status dos lembretes automáticos enviados via WhatsApp.
              </p>
              <Badge variant="outline" className="mt-3 text-[10px] font-semibold uppercase tracking-wider">
                Fonte de dados: {dataSourceLabel[dataSourceMode]}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/calendar/new">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Agendamento
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="outline">Abrir Agenda Completa</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex h-60 items-center justify-center rounded-lg border bg-card">
            <p className="text-muted-foreground">Carregando dados do dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Link href="/calendar" prefetch={false} className="block">
                <Card className="cursor-pointer transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Consultas do dia</CardTitle>
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold">{totalToday}</div>
                    <p className="text-xs text-muted-foreground">Em {formatDayLong(selectedDate)}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/calendar" prefetch={false} className="block">
                <Card className="cursor-pointer transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Confirmadas</CardTitle>
                    <CheckCheck className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold">{confirmedToday}</div>
                    <p className="text-xs text-muted-foreground">Pacientes com presença confirmada</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/calendar" prefetch={false} className="block">
                <Card className="cursor-pointer transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                    <Users className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold">{pendingToday}</div>
                    <p className="text-xs text-muted-foreground">Aguardando confirmação da equipe</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/calendar" prefetch={false} className="block">
                <Card className="cursor-pointer transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Lembretes</CardTitle>
                    <Bell className="h-4 w-4 text-rose-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold">{reminderLogs.length}</div>
                    <p className="text-xs text-muted-foreground">WhatsApps automáticos enviados</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <Card className="border-dashed">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Filtrar horários</CardTitle>
                      <CardDescription>Escolha quais profissionais deseja visualizar</CardDescription>
                    </div>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Especialidades</p>
                    <div className="space-y-3">
                      {specialtyOptions.length ? (
                        specialtyOptions.map((item) => (
                          <label key={item.value} className="flex items-center gap-3 text-sm font-medium">
                            <Checkbox
                              checked={activeSpecialties.has(item.value)}
                              onCheckedChange={() => toggleSpecialty(item.value)}
                            />
                            <span className={item.accent}>{item.label}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Cadastre profissionais para liberar os filtros.</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 px-0 text-xs text-muted-foreground"
                      disabled={!specialtyOptions.length}
                      onClick={() => setSelectedSpecialties(new Set(specialtyOptions.map((item) => item.value)))}
                    >
                      Exibir todas
                    </Button>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Equipe em plantão</p>
                    <div className="space-y-3">
                      {extendedProfessionals.length ? (
                        extendedProfessionals.map((pro) => (
                          <div
                            key={pro.id}
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                              activeProfessionalId === pro.id ? "border-primary bg-primary/5" : "border-muted"
                            }`}
                          >
                            <Avatar className="h-9 w-9 bg-muted">
                              <AvatarFallback className="text-xs font-semibold uppercase">
                                {pro.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold leading-tight">{pro.name}</p>
                              <p className="text-[11px] text-muted-foreground">{pro.specialty}</p>
                            </div>
                            <Badge variant="outline" className="text-[11px]">
                              {proSessionsMap[pro.id]?.length ?? 0} hoje
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhum profissional cadastrado até o momento.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="flex flex-col gap-4 border-b bg-card/70 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Programação diária</CardTitle>
                    <CardDescription>{formatDayLong(selectedDate)}</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-md border">
                      <Button variant="ghost" size="icon" onClick={() => handleNavigateDay("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleResetDate}>
                        Hoje
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleNavigateDay("next")}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {totalToday} atendimentos
                    </Badge>
                    <Select value={scheduleView} onValueChange={(value) => setScheduleView(value as "board" | "list" | "timeline")}>
                      <SelectTrigger className="w-[170px]">
                        <SelectValue placeholder="Modo de visualização" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="board">Grade por profissional</SelectItem>
                        <SelectItem value="list">Lista cronológica</SelectItem>
                        <SelectItem value="timeline">Tabela detalhada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">{renderScheduleContent()}</CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Próximas consultas</CardTitle>
                    <CardDescription>Visão focada por profissional</CardDescription>
                  </div>
                  <Select value={activeProfessionalId} onValueChange={setActiveProfessionalId}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {displayedProfessionals.map((pro) => (
                        <SelectItem key={pro.id} value={pro.id}>
                          {pro.name} • {pro.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  {focusSessions.length ? (
                    <div className="space-y-3">
                      {focusSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex flex-col gap-3 rounded-xl border bg-card/40 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">{formatTimeRange(session)}</p>
                            <p className="text-base font-semibold text-foreground">{session.patientName}</p>
                            <p className="text-sm text-muted-foreground">{session.procedureName}</p>
                          </div>
                          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:text-right">
                            <p>Contato: {session.patientPhone || "não informado"}</p>
                            <Badge variant="secondary" className="self-start sm:self-end">
                              {session.room ? `Sala ${session.room}` : "Sala principal"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma consulta para o profissional selecionado neste dia.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/30 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Lembretes automáticos</CardTitle>
                      <CardDescription>Envio via WhatsApp {reminderSettings.hoursBefore}h antes</CardDescription>
                    </div>
                    <Switch
                      checked={reminderSettings.enabled}
                      onCheckedChange={(checked) =>
                        setReminderSettings((prev) => ({
                          ...prev,
                          enabled: checked,
                        }))
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    {reminderSettings.enabled ? (
                      <span>
                        Próximo disparo automático programado para {reminderSettings.hoursBefore}h antes da consulta.
                      </span>
                    ) : (
                      <span>Os lembretes automáticos estão desativados.</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-semibold">{waitingReminders}</p>
                      <p className="text-xs text-muted-foreground">Aguardando envio</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-semibold">{remindersSentToday}</p>
                      <p className="text-xs text-muted-foreground">Enviados hoje</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Antecedência</p>
                    <Select
                      value={String(reminderSettings.hoursBefore)}
                      onValueChange={(value) =>
                        setReminderSettings((prev) => ({
                          ...prev,
                          hoursBefore: Number(value),
                        }))
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="24 horas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 horas</SelectItem>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="48">48 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    variant="secondary"
                    disabled={isProcessingReminder || !reminderSettings.enabled}
                    onClick={handleManualReminder}
                  >
                    {isProcessingReminder && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    Disparar lembretes agora
                  </Button>

                  {latestReminderLogs.length ? (
                    <div className="rounded-lg border bg-muted/40 p-3 text-xs">
                      <p className="mb-1 font-semibold text-foreground">Últimos envios</p>
                      <ul className="space-y-1 text-muted-foreground">
                        {latestReminderLogs.map((log) => (
                          <li key={`${log.sessionId}-${log.sentAt}`}>
                            • {log.patientName} • {formatDateTime(log.scheduledDate)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">Nenhum envio registrado ainda.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lista rápida</CardTitle>
                  <CardDescription>Próximos pacientes em todas as especialidades</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length ? (
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="flex flex-col gap-2 rounded-xl border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">{formatTimeRange(session)}</p>
                            <p className="text-base font-semibold">{session.patientName}</p>
                            <p className="text-sm text-muted-foreground">{session.procedureName}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[11px]">
                              {session.professionalName}
                            </Badge>
                            <p className="text-xs text-muted-foreground">{session.professionalSpecialty}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma consulta futura encontrada.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de lembretes</CardTitle>
                  <CardDescription>Envios automáticos armazenados localmente</CardDescription>
                </CardHeader>
                <CardContent>
                  {reminderLogs.length ? (
                    <ScrollArea className="h-64 pr-2">
                      <div className="space-y-3 text-sm">
                        {[...reminderLogs].reverse().map((log) => (
                          <div key={`${log.sessionId}-${log.sentAt}`} className="rounded-lg border bg-muted/30 p-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDateTime(log.sentAt)}</span>
                              <Badge variant="outline" className="text-[10px]">
                                WhatsApp
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm font-semibold">{log.patientName}</p>
                            <p className="text-xs text-muted-foreground">Consulta: {formatDateTime(log.scheduledDate)}</p>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{log.messagePreview}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                      <p className="text-sm text-muted-foreground">Nenhum lembrete enviado ainda.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
