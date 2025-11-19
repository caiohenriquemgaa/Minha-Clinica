"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { adjustEquipmentStock, getEquipmentById, updateEquipment, type Equipment } from "@/lib/equipment"

export default function EquipmentDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [adjustment, setAdjustment] = useState(0)

  const loadEquipment = useCallback(async () => {
    const data = await getEquipmentById(params.id)
    setEquipment(data)
  }, [params.id])

  useEffect(() => {
    loadEquipment()
  }, [loadEquipment])

  const handleChange = (field: keyof Equipment, value: string) => {
    if (!equipment) return
    setEquipment({ ...equipment, [field]: value })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!equipment) return
    if (!equipment.name.trim()) {
      setError("O nome é obrigatório.")
      return
    }

    setIsSaving(true)
    try {
      await updateEquipment(equipment.id, {
        name: equipment.name,
        brand: equipment.brand,
        model: equipment.model,
        stock: equipment.stock,
        unit: equipment.unit,
        location: equipment.location,
        minimumStock: equipment.minimumStock,
        notes: equipment.notes,
      })
      router.refresh()
    } catch (err) {
      setError("Não foi possível salvar as alterações.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdjustment = async () => {
    if (!equipment || !adjustment) return
    await adjustEquipmentStock(equipment.id, adjustment)
    setAdjustment(0)
    loadEquipment()
  }

  if (!equipment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Equipamento não encontrado.</p>
      </div>
    )
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
            <h1 className="text-2xl font-semibold">{equipment.name}</h1>
            <p className="text-sm text-muted-foreground">{equipment.brand}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Editar item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={equipment.name} onChange={(e) => handleChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input value={equipment.brand || ""} onChange={(e) => handleChange("brand", e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min={0}
                    value={equipment.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Input value={equipment.unit} onChange={(e) => handleChange("unit", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Estoque mínimo</Label>
                  <Input
                    type="number"
                    min={0}
                    value={equipment.minimumStock || 0}
                    onChange={(e) => handleChange("minimumStock", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Localização</Label>
                <Input value={equipment.location || ""} onChange={(e) => handleChange("location", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={equipment.notes || ""} onChange={(e) => handleChange("notes", e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Salvar alterações
          </Button>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Ajustar estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Quantidade (+ reposição / - consumo)</Label>
                <Input
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(Number(e.target.value))}
                  placeholder="Ex.: -2"
                />
              </div>
              <div className="space-y-2 md:col-span-2 flex gap-2">
                <Button type="button" onClick={handleAdjustment} disabled={!adjustment}>
                  Registrar ajuste
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Histórico recente</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                {(equipment.usageHistory || []).slice(-5).map((history) => (
                  <div key={history.id} className="flex justify-between border rounded p-2">
                    <span>{history.description}</span>
                    <span className={history.quantity < 0 ? "text-destructive" : "text-emerald-600"}>
                      {history.quantity > 0 ? `+${history.quantity}` : history.quantity} {equipment.unit}
                    </span>
                  </div>
                ))}
                {!equipment.usageHistory?.length && <p>Nenhum registro ainda.</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
