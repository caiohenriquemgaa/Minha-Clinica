"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, RefreshCw, CheckCircle, Settings, ArrowLeft } from "lucide-react"
import {
  authenticateGoogleCalendar,
  getGoogleCalendars,
  syncAllSessions,
  type CalendarSyncSettings,
} from "@/lib/google-calendar"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function CalendarSettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [calendars, setCalendars] = useState<Array<{ id: string; name: string }>>([])
  const [settings, setSettings] = useState<CalendarSyncSettings>({
    enabled: false,
    calendarId: "",
    syncDirection: "both",
    autoSync: false,
  })

  const handleAuthenticate = async () => {
    setIsAuthenticating(true)
    try {
      const success = await authenticateGoogleCalendar()
      if (success) {
        setIsAuthenticated(true)
        const availableCalendars = await getGoogleCalendars()
        setCalendars(availableCalendars)
        toast({
          title: "Autenticação realizada",
          description: "Conectado ao Google Calendar com sucesso.",
        })
      }
    } catch (error) {
      toast({
        title: "Erro na autenticação",
        description: "Não foi possível conectar ao Google Calendar.",
        variant: "destructive",
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleSyncNow = async () => {
    if (!settings.enabled || !settings.calendarId) return

    setIsSyncing(true)
    try {
      // Mock sessions data - in real app, fetch from database
      const sessions: any[] = []
      const result = await syncAllSessions(sessions, settings)

      toast({
        title: "Sincronização concluída",
        description: `${result.success} eventos sincronizados com sucesso.`,
      })

      setSettings((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
      }))
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Google Calendar.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/calendar">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Agenda
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Calendário</h1>
        </div>
        <p className="text-gray-600">
          Configure a integração com o Google Calendar para sincronizar seus agendamentos.
        </p>
      </div>

      <div className="space-y-6">
        {/* Authentication Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-emerald-600" />
              Conexão com Google Calendar
            </CardTitle>
            <CardDescription>
              Conecte sua conta do Google para sincronizar agendamentos automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isAuthenticated ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className="font-medium">{isAuthenticated ? "Conectado" : "Não conectado"}</span>
                {isAuthenticated && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                )}
              </div>
              <Button
                onClick={handleAuthenticate}
                disabled={isAuthenticating || isAuthenticated}
                variant={isAuthenticated ? "outline" : "default"}
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : isAuthenticated ? (
                  "Reconectar"
                ) : (
                  "Conectar ao Google"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings Card */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-600" />
                Configurações de Sincronização
              </CardTitle>
              <CardDescription>Configure como os agendamentos serão sincronizados entre os sistemas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Sync */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Ativar sincronização</h4>
                  <p className="text-sm text-gray-600">Sincronizar agendamentos automaticamente</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => setSettings((prev) => ({ ...prev, enabled }))}
                />
              </div>

              <Separator />

              {settings.enabled && (
                <>
                  {/* Calendar Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Calendário de destino</label>
                    <Select
                      value={settings.calendarId}
                      onValueChange={(calendarId) => setSettings((prev) => ({ ...prev, calendarId }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um calendário" />
                      </SelectTrigger>
                      <SelectContent>
                        {calendars.map((calendar) => (
                          <SelectItem key={calendar.id} value={calendar.id}>
                            {calendar.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sync Direction */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Direção da sincronização</label>
                    <Select
                      value={settings.syncDirection}
                      onValueChange={(syncDirection: "both" | "to_google" | "from_google") =>
                        setSettings((prev) => ({ ...prev, syncDirection }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Bidirecional (ambos os sentidos)</SelectItem>
                        <SelectItem value="to_google">Apenas para Google Calendar</SelectItem>
                        <SelectItem value="from_google">Apenas do Google Calendar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Auto Sync */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Sincronização automática</h4>
                      <p className="text-sm text-gray-600">Sincronizar a cada 15 minutos</p>
                    </div>
                    <Switch
                      checked={settings.autoSync}
                      onCheckedChange={(autoSync) => setSettings((prev) => ({ ...prev, autoSync }))}
                    />
                  </div>

                  <Separator />

                  {/* Manual Sync */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Sincronização manual</h4>
                      <p className="text-sm text-gray-600">
                        {settings.lastSyncAt
                          ? `Última sincronização: ${new Date(settings.lastSyncAt).toLocaleString("pt-BR")}`
                          : "Nunca sincronizado"}
                      </p>
                    </div>
                    <Button onClick={handleSyncNow} disabled={isSyncing || !settings.calendarId} variant="outline">
                      {isSyncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sincronizar agora
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status da Integração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Eventos sincronizados</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">100%</div>
                <div className="text-sm text-gray-600">Taxa de sucesso</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{settings.autoSync ? "Ativo" : "Inativo"}</div>
                <div className="text-sm text-gray-600">Sincronização automática</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
