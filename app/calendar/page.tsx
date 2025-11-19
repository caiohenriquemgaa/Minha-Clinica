"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  DollarSign,
  RefreshCw,
  Settings,
  Cloud,
  CloudOff,
  ArrowLeft,
} from "lucide-react"
import {
  getSessions,
  getSessionsByDate,
  getStatusColor,
  getStatusLabel,
  formatPrice,
  formatDuration,
  getSessionStats,
  type Session,
} from "@/lib/sessions"
import { syncAllSessions, type CalendarSyncSettings } from "@/lib/google-calendar"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function CalendarPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dailySessions, setDailySessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSettings, setSyncSettings] = useState<CalendarSyncSettings>({
    enabled: false,
    calendarId: "",
    syncDirection: "both",
    autoSync: false,
  })
  const [lastSyncStatus, setLastSyncStatus] = useState<"success" | "error" | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getSessions()
      setSessions(data)
    } catch (error) {
      console.error("Erro ao carregar sessões:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadDailySessions = useCallback(async (date: Date) => {
    try {
      const dateString = date.toISOString().split("T")[0]
      const data = await getSessionsByDate(dateString)
      setDailySessions(data)
    } catch (error) {
      console.error("Erro ao carregar sessões do dia:", error)
    }
  }, [])

  const loadSyncSettings = useCallback(async () => {
    try {
      // In a real app, load from localStorage or API
      const saved = localStorage.getItem("calendar-sync-settings")
      if (saved) {
        setSyncSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Erro ao carregar configurações de sincronização:", error)
    }
  }, [])

  useEffect(() => {
    loadSessions()
    loadSyncSettings()
  }, [loadSessions, loadSyncSettings])

  useEffect(() => {
    loadDailySessions(selectedDate)
  }, [selectedDate, loadDailySessions])

  const handleManualSync = async () => {
    if (!syncSettings.enabled || !syncSettings.calendarId) {
      toast({
        title: "Sincronização não configurada",
        description: "Configure a integração com Google Calendar primeiro.",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    try {
      const result = await syncAllSessions(sessions, syncSettings)
      setLastSyncStatus("success")

      // Update sync settings with last sync time
      const updatedSettings = {
        ...syncSettings,
        lastSyncAt: new Date().toISOString(),
      }
      setSyncSettings(updatedSettings)
      localStorage.setItem("calendar-sync-settings", JSON.stringify(updatedSettings))

      toast({
        title: "Sincronização concluída",
        description: `${result.success} eventos sincronizados com sucesso.`,
      })
    } catch (error) {
      setLastSyncStatus("error")
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Google Calendar.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    }
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const stats = getSessionStats(sessions)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando agenda...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
                {syncSettings.enabled && (
                  <Badge variant="secondary" className="ml-2">
                    {syncSettings.enabled ? (
                      <>
                        <Cloud className="h-3 w-3 mr-1" />
                        Sincronizado
                      </>
                    ) : (
                      <>
                        <CloudOff className="h-3 w-3 mr-1" />
                        Offline
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {syncSettings.enabled && (
                <Button variant="outline" size="sm" onClick={handleManualSync} disabled={isSyncing}>
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar
                    </>
                  )}
                </Button>
              )}
              <Link href="/settings/calendar">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Sync
                </Button>
              </Link>
              <Link href="/calendar/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Sessão
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {syncSettings.enabled && syncSettings.lastSyncAt && (
          <Card className="mb-6 border-emerald-200 bg-emerald-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-800">
                    Última sincronização: {new Date(syncSettings.lastSyncAt).toLocaleString("pt-BR")}
                  </span>
                  {lastSyncStatus === "success" && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      Sucesso
                    </Badge>
                  )}
                  {lastSyncStatus === "error" && <Badge variant="destructive">Erro</Badge>}
                </div>
                <Button variant="ghost" size="sm" onClick={handleManualSync} disabled={isSyncing}>
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completed} concluídas, {stats.scheduled + stats.confirmed} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailySessions.length}</div>
              <p className="text-xs text-muted-foreground">
                {dailySessions.filter((s) => s.status === "confirmed").length} confirmadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Sessões concluídas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <Badge variant="secondary">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">de {stats.total} sessões</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Navigation */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Hoje
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedDate.toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                      day: view === "day" ? "numeric" : undefined,
                    })}
                  </h2>
                  {view === "day" && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString("pt-BR", { weekday: "long" })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>
                  Mês
                </Button>
                <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>
                  Semana
                </Button>
                <Button variant={view === "day" ? "default" : "outline"} size="sm" onClick={() => setView("day")}>
                  Dia
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Sessions for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle>
              Sessões de {selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
            </CardTitle>
            <CardDescription>{dailySessions.length} sessão(ões) agendada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {dailySessions.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma sessão agendada para este dia</p>
                <Link href="/calendar/new">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Sessão
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="w-[70px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySessions
                      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                      .map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {new Date(session.scheduledDate).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{session.patientName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{session.procedureName}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{formatDuration(session.durationMinutes)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: `${getStatusColor(session.status)}20`,
                                color: getStatusColor(session.status),
                              }}
                            >
                              {getStatusLabel(session.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatPrice(session.price)}</span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/calendar/${session.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Detalhes
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/calendar/${session.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
