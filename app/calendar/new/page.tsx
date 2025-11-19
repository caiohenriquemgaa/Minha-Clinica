"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, CalendarIcon, Clock, User, Scissors } from "lucide-react"
import {
  createSession,
  generateTimeSlots,
  getSessionsByDate,
  type SessionFormData,
  type TimeSlot,
} from "@/lib/sessions"
import { getPatients, type Patient } from "@/lib/patients"
import { getProcedures, formatPrice, formatDuration, type Procedure } from "@/lib/procedures"
import { getProfessionals, type Professional } from "@/lib/professionals"
import { getAnamnesisTemplates, type AnamnesisTemplate } from "@/lib/anamnesis"
import Link from "next/link"

export default function NewSessionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [templates, setTemplates] = useState<AnamnesisTemplate[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)

  const [formData, setFormData] = useState<SessionFormData & { date: string; time: string }>({
    patientId: "",
    procedureId: "",
    scheduledDate: "",
    date: "",
    time: "",
    notes: "",
    price: 0,
    professionalId: "",
    anamnesisTemplateId: "",
  })

  const loadInitialData = useCallback(async () => {
    try {
      const [patientsData, proceduresData, professionalsData, templatesData] = await Promise.all([
        getPatients(),
        getProcedures(),
        getProfessionals(),
        getAnamnesisTemplates(),
      ])
      setPatients(patientsData)
      setProcedures(proceduresData.filter((p) => p.isActive))
      setProfessionals(professionalsData)
      setTemplates(templatesData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const loadTimeSlots = useCallback(async (date: string) => {
    try {
      const existingSessions = await getSessionsByDate(date)
      const slots = generateTimeSlots(date, existingSessions)
      setTimeSlots(slots)
    } catch (error) {
      console.error("Erro ao carregar horários:", error)
    }
  }, [])

  useEffect(() => {
    if (formData.date) {
      loadTimeSlots(formData.date)
    }
  }, [formData.date, loadTimeSlots])

  useEffect(() => {
    if (formData.procedureId) {
      const procedure = procedures.find((p) => p.id === formData.procedureId)
      setSelectedProcedure(procedure || null)
      if (procedure) {
        setFormData((prev) => ({ ...prev, price: procedure.price }))
      }
    }
  }, [formData.procedureId, procedures])

  useEffect(() => {
    if (formData.date && formData.time) {
      const scheduledDate = new Date(`${formData.date}T${formData.time}:00`).toISOString()
      setFormData((prev) => ({ ...prev, scheduledDate }))
    }
  }, [formData.date, formData.time])

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.patientId) {
      setError("Selecione um paciente")
      return
    }

    if (!formData.procedureId) {
      setError("Selecione um procedimento")
      return
    }

    if (!formData.date) {
      setError("Selecione uma data")
      return
    }

    if (!formData.time) {
      setError("Selecione um horário")
      return
    }

    if (!formData.scheduledDate) {
      setError("Data e horário inválidos")
      return
    }

    // Check if selected time slot is available
    const selectedSlot = timeSlots.find((slot) => slot.time === formData.time)
    if (!selectedSlot?.available) {
      setError("Horário não disponível")
      return
    }

    setIsLoading(true)

    try {
      const patient = patients.find((p) => p.id === formData.patientId)
      const procedure = procedures.find((p) => p.id === formData.procedureId)
      const professional = professionals.find((pro) => pro.id === formData.professionalId)

      const sessionData: SessionFormData = {
        patientId: formData.patientId,
        patientName: patient?.name,
        procedureId: formData.procedureId,
        procedureName: procedure?.name,
        scheduledDate: formData.scheduledDate,
        notes: formData.notes,
        price: formData.price,
        durationMinutes: procedure?.durationMinutes,
        professionalId: professional?.id,
        professionalName: professional?.name,
        professionalSpecialty: professional?.specialty,
        room: professional ? `Sala ${professional.specialty}` : undefined,
        anamnesisTemplateId: formData.anamnesisTemplateId || procedure?.relatedAnamnesisIds?.[0],
      }

      await createSession(sessionData)
      router.push("/calendar")
    } catch (err) {
      setError("Erro ao agendar sessão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Nova Sessão</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Patient and Procedure */}
          <Card>
            <CardHeader>
              <CardTitle>Paciente e Procedimento</CardTitle>
              <CardDescription>Selecione o paciente e o tipo de tratamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Paciente *</Label>
                <Select value={formData.patientId} onValueChange={(value) => handleInputChange("patientId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{patient.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedureId">Procedimento *</Label>
                <Select value={formData.procedureId} onValueChange={(value) => handleInputChange("procedureId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um procedimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((procedure) => (
                      <SelectItem key={procedure.id} value={procedure.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4" />
                            <span>{procedure.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(procedure.durationMinutes)}</span>
                            <span>•</span>
                            <span>{formatPrice(procedure.price)}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionalId">Profissional responsável</Label>
                <Select value={formData.professionalId} onValueChange={(value) => handleInputChange("professionalId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{professional.name}</span>
                          <span className="text-xs text-muted-foreground">{professional.specialty}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anamnesisTemplateId">Template de anamnese</Label>
                <Select
                  value={formData.anamnesisTemplateId}
                  onValueChange={(value) => handleInputChange("anamnesisTemplateId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione se desejar vincular" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.title}</span>
                          <span className="text-xs text-muted-foreground">{template.category}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProcedure && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{selectedProcedure.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duração:</span>
                      <span className="ml-2 font-medium">{formatDuration(selectedProcedure.durationMinutes)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="ml-2 font-medium">{formatPrice(selectedProcedure.price)}</span>
                    </div>
                  </div>
                  {selectedProcedure.description && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedProcedure.description}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date and Time */}
          <Card>
            <CardHeader>
              <CardTitle>Data e Horário</CardTitle>
              <CardDescription>Escolha quando a sessão será realizada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>

              {formData.date && (
                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <Select value={formData.time} onValueChange={(value) => handleInputChange("time", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.time} value={slot.time} disabled={!slot.available}>
                          <div className="flex items-center justify-between w-full">
                            <span>{slot.time}</span>
                            {!slot.available && <span className="text-xs text-destructive">Ocupado</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Horários disponíveis das 08:00 às 18:00 (intervalos de 30 minutos)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
              <CardDescription>Observações e ajustes de preço</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para usar o preço padrão do procedimento
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Observações sobre a sessão, cuidados especiais, etc..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/calendar">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Agendando..." : "Agendar Sessão"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
