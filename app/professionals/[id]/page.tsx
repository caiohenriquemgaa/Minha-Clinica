"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { getProfessional, updateProfessional, type Professional } from "@/lib/professionals"

export default function ProfessionalDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const loadProfessional = useCallback(async () => {
    const data = await getProfessional(params.id)
    setProfessional(data)
  }, [params.id])

  useEffect(() => {
    loadProfessional()
  }, [loadProfessional])

  const handleChange = (field: keyof Professional, value: string) => {
    if (!professional) return
    setProfessional({ ...professional, [field]: value })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!professional) return
    if (!professional.name.trim() || !professional.specialty.trim()) {
      setError("Nome e especialidade são obrigatórios.")
      return
    }

    setIsSaving(true)
    try {
      await updateProfessional(professional.id, professional)
      router.refresh()
    } catch (err) {
      setError("Não foi possível salvar as alterações.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profissional não encontrado.</p>
      </div>
    )
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
            <h1 className="text-2xl font-semibold">{professional.name}</h1>
            <p className="text-sm text-muted-foreground">{professional.specialty}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Editar profissional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={professional.name} onChange={(e) => handleChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Especialidade</Label>
                  <Input value={professional.specialty} onChange={(e) => handleChange("specialty", e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={professional.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={professional.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário de atendimento</Label>
                  <Input
                    value={professional.workingHours || ""}
                    onChange={(e) => handleChange("workingHours", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Input value={professional.color || ""} onChange={(e) => handleChange("color", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={professional.bio || ""} onChange={(e) => handleChange("bio", e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Salvar alterações
          </Button>
        </form>
      </main>
    </div>
  )
}
