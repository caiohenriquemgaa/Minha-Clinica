"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Edit,
  CalendarIcon,
  Clock,
  User,
  Scissors,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  MessageCircle,
} from "lucide-react"
import {
  getSession,
  updateSession,
  getStatusColor,
  getStatusLabel,
  formatPrice,
  formatDuration,
  type Session,
  logSessionMaterialUsage,
} from "@/lib/sessions"
import Link from "next/link"
import { getEquipment, type Equipment } from "@/lib/equipment"

export default function SessionDetailPage() {
  const params = useParams()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [usageForm, setUsageForm] = useState({ equipmentId: "", quantity: 1 })
  const [isRegisteringUsage, setIsRegisteringUsage] = useState(false)

  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getSession(params.id as string)
      setSession(data)
    } catch (error) {
      console.error("Erro ao carregar sessão:", error)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  const loadEquipmentList = useCallback(async () => {
    const data = await getEquipment()
    setEquipment(data)
  }, [])

  useEffect(() => {
    loadSession()
    loadEquipmentList()
  }, [loadSession, loadEquipmentList])

  const handleStatusUpdate = async (newStatus: Session["status"]) => {
    if (!session) return

    try {
      setIsUpdating(true)
      const updatedSession = await updateSession(session.id, { status: newStatus })
      setSession(updatedSession)
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUsageSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!session || !usageForm.equipmentId || usageForm.quantity <= 0) return

    setIsRegisteringUsage(true)
    try {
      const updated = await logSessionMaterialUsage(session.id, usageForm.equipmentId, usageForm.quantity)
      setSession(updated)
      setUsageForm({ equipmentId: "", quantity: 1 })
    } catch (error) {
      console.error("Erro ao registrar consumo:", error)
    } finally {
      setIsRegisteringUsage(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/calendar">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold text-foreground">Carregando...</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando dados da sessão...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/calendar">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold text-foreground">Sessão não encontrada</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Sessão não encontrada</p>
              <p className="text-muted-foreground mb-4">A sessão solicitada não existe ou foi removida.</p>
              <Link href="/calendar">
                <Button>Voltar para Agenda</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const sessionDate = new Date(session.scheduledDate)
  const sessionEndTime = new Date(sessionDate.getTime() + session.durationMinutes * 60000)
  const sanitizedPhone = session.patientPhone?.replace(/\D/g, "") || ""
  const whatsAppLink = sanitizedPhone ? `https://wa.me/${sanitizedPhone}` : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/calendar">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold text-foreground">Detalhes da Sessão</h1>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {session.status === "scheduled" && (
                <Button variant="outline" onClick={() => handleStatusUpdate("confirmed")} disabled={isUpdating} className="min-h-11">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar
                </Button>
              )}
              {session.status === "confirmed" && (
                <Button variant="outline" onClick={() => handleStatusUpdate("completed")} disabled={isUpdating} className="min-h-11">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
              )}
              {(session.status === "scheduled" || session.status === "confirmed") && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate("cancelled")}
                  disabled={isUpdating}
                  className="min-h-11 text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
              <Link href={`/calendar/${session.id}/edit`}>
                <Button className="min-h-11 w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Dados do cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Paciente</p>
                    <p className="font-medium">{session.patientName}</p>
                  </div>
                </div>
                {session.patientPhone && (
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contato</p>
                      <p className="font-medium">{session.patientPhone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Procedimento e data/hora</CardTitle>
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${getStatusColor(session.status)}20`,
                      color: getStatusColor(session.status),
                    }}
                  >
                    {getStatusLabel(session.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Scissors className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Procedimento</p>
                      <p className="font-medium">{session.procedureName}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {sessionDate.toLocaleDateString("pt-BR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Horário</p>
                      <p className="font-medium">
                        {sessionDate.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {sessionEndTime.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duração</p>
                      <p className="font-medium">{formatDuration(session.durationMinutes)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(session.price)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {session.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 text-primary" />
                    <p className="rounded-lg bg-muted p-3 text-sm">{session.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {whatsAppLink ? (
                  <Button asChild className="min-h-11 w-full justify-start">
                    <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button className="min-h-11 w-full justify-start" disabled>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp indisponível
                  </Button>
                )}
                <Link href={`/patients/${session.patientId}`}>
                  <Button className="min-h-11 w-full justify-start bg-transparent" variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    Ver Paciente
                  </Button>
                </Link>
                <Link href={`/procedures/${session.procedureId}`}>
                  <Button className="min-h-11 w-full justify-start bg-transparent" variant="outline">
                    <Scissors className="h-4 w-4 mr-2" />
                    Ver Procedimento
                  </Button>
                </Link>
                <Link href={`/calendar/${session.id}/edit`}>
                  <Button className="min-h-11 w-full justify-start bg-transparent" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Remarcar / Editar
                  </Button>
                </Link>
                {(session.status === "scheduled" || session.status === "confirmed") && (
                  <Button
                    variant="outline"
                    className="min-h-11 w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar sessão
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Session Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Criada em</span>
                  <span className="text-sm font-medium">{new Date(session.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última atualização</span>
                  <span className="text-sm font-medium">{new Date(session.updatedAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status atual</span>
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${getStatusColor(session.status)}20`,
                      color: getStatusColor(session.status),
                    }}
                  >
                    {getStatusLabel(session.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{formatPrice(session.price)}</p>
                  <p className="text-sm text-muted-foreground">Valor da sessão</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status do pagamento</span>
                    <span className="font-medium">{session.status === "completed" ? "Pago" : "Pendente"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Materiais utilizados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  {session.equipmentUsed?.length ? (
                    session.equipmentUsed.map((usage) => (
                      <div key={usage.id} className="rounded border px-3 py-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{usage.equipmentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(usage.recordedAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <Badge variant="secondary">{usage.quantity > 0 ? `+${usage.quantity}` : usage.quantity}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-xs">Nenhum consumo registrado.</p>
                  )}
                </div>
                <Separator />
                <form onSubmit={handleUsageSubmit} className="space-y-2">
                  <Label>Registrar consumo</Label>
                  <Select
                    value={usageForm.equipmentId}
                    onValueChange={(value) => setUsageForm((prev) => ({ ...prev, equipmentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.stock} {item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={usageForm.quantity}
                      onChange={(e) => setUsageForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                    />
                    <Button type="submit" disabled={!usageForm.equipmentId || isRegisteringUsage}>
                      Registrar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
