"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { createProfessional } from "@/lib/professionals"

export default function NewProfessionalPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    phone: "",
    email: "",
    workingHours: "",
    color: "",
    bio: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name.trim() || !formData.specialty.trim()) {
      setError("Nome e especialidade são obrigatórios.")
      return
    }

    setIsSubmitting(true)
    try {
      await createProfessional(formData)
      router.push("/professionals")
    } catch (err) {
      setError("Não foi possível cadastrar o profissional.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/professionals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Novo Profissional</h1>
            <p className="text-sm text-muted-foreground">Cadastre alguém da sua equipe</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Dados básicos</CardTitle>
              <CardDescription>Informações usadas nos agendamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome completo *</Label>
                  <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Especialidade *</Label>
                  <Input
                    value={formData.specialty}
                    onChange={(e) => handleChange("specialty", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário de atendimento</Label>
                  <Input value={formData.workingHours} onChange={(e) => handleChange("workingHours", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cor de destaque</Label>
                  <Input value={formData.color} onChange={(e) => handleChange("color", e.target.value)} placeholder="#a855f7" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio / Observações</Label>
                <Textarea value={formData.bio} onChange={(e) => handleChange("bio", e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar profissional
          </Button>
        </form>
      </main>
    </div>
  )
}
