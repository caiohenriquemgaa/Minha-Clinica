"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Scissors } from "lucide-react"
import { createProcedure, procedureCategories, type ProcedureFormData } from "@/lib/procedures"
import Link from "next/link"

export default function NewProcedurePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<ProcedureFormData>({
    name: "",
    description: "",
    category: "",
    durationMinutes: 60,
    price: 0,
    isActive: true,
  })

  const handleInputChange = (field: keyof ProcedureFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.name.trim()) {
      setError("Nome do procedimento é obrigatório")
      return
    }

    if (!formData.category) {
      setError("Categoria é obrigatória")
      return
    }

    if (formData.durationMinutes <= 0) {
      setError("Duração deve ser maior que zero")
      return
    }

    if (formData.price < 0) {
      setError("Preço não pode ser negativo")
      return
    }

    setIsLoading(true)

    try {
      await createProcedure(formData)
      router.push("/procedures")
    } catch (err) {
      setError("Erro ao cadastrar procedimento. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/procedures">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Novo Procedimento</h1>
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

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do procedimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Procedimento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: Limpeza de Pele Profunda"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedureCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descreva o procedimento, benefícios e indicações..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing and Duration */}
          <Card>
            <CardHeader>
              <CardTitle>Preço e Duração</CardTitle>
              <CardDescription>Configurações de tempo e valor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duração (minutos) *</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="1"
                    max="480"
                    value={formData.durationMinutes}
                    onChange={(e) => handleInputChange("durationMinutes", Number.parseInt(e.target.value) || 0)}
                    placeholder="60"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Tempo estimado para realizar o procedimento</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                    placeholder="120.00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Valor cobrado pelo procedimento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Disponibilidade do procedimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange("isActive", e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="isActive">Procedimento ativo</Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Procedimentos ativos ficam disponíveis para agendamento
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/procedures">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Procedimento"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
