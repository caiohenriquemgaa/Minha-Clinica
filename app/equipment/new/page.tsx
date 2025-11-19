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
import { createEquipment } from "@/lib/equipment"

export default function NewEquipmentPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    stock: 0,
    unit: "un",
    location: "",
    minimumStock: 0,
    notes: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      setError("O nome do equipamento é obrigatório.")
      return
    }
    if (formData.stock < 0) {
      setError("Estoque não pode ser negativo.")
      return
    }

    setIsSubmitting(true)
    try {
      await createEquipment({
        ...formData,
        stock: Number(formData.stock),
        minimumStock: formData.minimumStock ? Number(formData.minimumStock) : undefined,
      })
      router.push("/equipment")
    } catch (err) {
      setError("Não foi possível salvar o equipamento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/equipment">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Novo Equipamento</h1>
            <p className="text-sm text-muted-foreground">Controle seu estoque</p>
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
              <CardTitle>Informações do item</CardTitle>
              <CardDescription>Detalhes que facilitarão o controle de uso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input value={formData.brand} onChange={(e) => handleChange("brand", e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade *</Label>
                  <Input value={formData.unit} onChange={(e) => handleChange("unit", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Estoque mínimo</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.minimumStock}
                    onChange={(e) => handleChange("minimumStock", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Localização</Label>
                <Input value={formData.location} onChange={(e) => handleChange("location", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            Salvar item
          </Button>
        </form>
      </main>
    </div>
  )
}
