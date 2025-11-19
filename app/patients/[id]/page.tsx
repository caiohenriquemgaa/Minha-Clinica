"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Calendar, FileText, Phone, Mail, MapPin, User, Heart, AlertTriangle } from "lucide-react"
import { getPatient, calculateAge, formatPhone, formatCPF, type Patient } from "@/lib/patients"
import Link from "next/link"

export default function PatientDetailPage() {
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadPatient = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getPatient(params.id as string)
      setPatient(data)
    } catch (error) {
      console.error("Erro ao carregar paciente:", error)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadPatient()
  }, [loadPatient])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/patients">
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
            <p className="text-muted-foreground">Carregando dados do paciente...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/patients">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold text-foreground">Paciente não encontrado</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Paciente não encontrado</p>
              <p className="text-muted-foreground mb-4">O paciente solicitado não existe ou foi removido.</p>
              <Link href="/patients">
                <Button>Voltar para Lista de Pacientes</Button>
              </Link>
            </CardContent>
          </Card>
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
              <Link href="/patients">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold text-foreground">{patient.name}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Agendar
              </Button>
              <Link href={`/patients/${patient.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                    <p className="text-lg font-medium">{patient.name}</p>
                  </div>
                  {patient.cpf && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CPF</p>
                      <p className="text-lg">{formatCPF(patient.cpf)}</p>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {patient.birthDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Idade</p>
                      <p className="text-lg">{calculateAge(patient.birthDate)} anos</p>
                    </div>
                  )}
                  {patient.gender && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gênero</p>
                      <p className="text-lg">{patient.gender}</p>
                    </div>
                  )}
                  {patient.birthDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                      <p className="text-lg">{new Date(patient.birthDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {patient.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                        <p className="text-lg">{patient.email}</p>
                      </div>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                        <p className="text-lg">{formatPhone(patient.phone)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {(patient.address || patient.city || patient.state) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                      <div className="text-lg">
                        {patient.address && <p>{patient.address}</p>}
                        {(patient.city || patient.state) && (
                          <p>
                            {patient.city}
                            {patient.city && patient.state && ", "}
                            {patient.state}
                            {patient.zipCode && ` - ${patient.zipCode}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Informações Médicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.medicalHistory && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Histórico Médico</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{patient.medicalHistory}</p>
                  </div>
                )}

                {patient.allergies && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Alergias
                    </p>
                    <Badge variant="destructive" className="text-sm">
                      {patient.allergies}
                    </Badge>
                  </div>
                )}

                {patient.medications && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Medicamentos em Uso</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{patient.medications}</p>
                  </div>
                )}

                {!patient.medicalHistory && !patient.allergies && !patient.medications && (
                  <p className="text-muted-foreground text-center py-4">Nenhuma informação médica cadastrada</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Emergency Contact */}
            {(patient.emergencyContactName || patient.emergencyContactPhone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contato de Emergência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.emergencyContactName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nome</p>
                      <p className="font-medium">{patient.emergencyContactName}</p>
                    </div>
                  )}
                  {patient.emergencyContactPhone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p className="font-medium">{formatPhone(patient.emergencyContactPhone)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Nova Anamnese
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Heart className="h-4 w-4 mr-2" />
                  Histórico de Sessões
                </Button>
              </CardContent>
            </Card>

            {/* Patient Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cadastrado em</span>
                  <span className="text-sm font-medium">{new Date(patient.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total de Sessões</span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última Visita</span>
                  <span className="text-sm font-medium">-</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
