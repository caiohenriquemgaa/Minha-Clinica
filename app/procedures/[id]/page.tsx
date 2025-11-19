"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Edit, Calendar, Clock, DollarSign, Scissors, Tag, FileText, Upload } from "lucide-react"
import {
  getProcedure,
  getCategoryInfo,
  formatPrice,
  formatDuration,
  type Procedure,
  addProcedureImages,
  updateProcedure,
} from "@/lib/procedures"
import { getAnamnesisTemplates, type AnamnesisTemplate } from "@/lib/anamnesis"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function ProcedureDetailPage() {
  const params = useParams()
  const [procedure, setProcedure] = useState<Procedure | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [templates, setTemplates] = useState<AnamnesisTemplate[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  const [isSavingTemplates, setIsSavingTemplates] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)

  const loadProcedure = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getProcedure(params.id as string)
      setProcedure(data)
      setSelectedTemplates(new Set(data?.relatedAnamnesisIds || []))
    } catch (error) {
      console.error("Erro ao carregar procedimento:", error)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  const loadTemplates = useCallback(async () => {
    const data = await getAnamnesisTemplates()
    setTemplates(data)
  }, [])

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleTemplatesSave = async () => {
    if (!procedure) return
    setIsSavingTemplates(true)
    try {
      const updated = await updateProcedure(procedure.id, { relatedAnamnesisIds: Array.from(selectedTemplates) })
      setProcedure(updated)
    } finally {
      setIsSavingTemplates(false)
    }
  }

  const handleGalleryUpload = async (type: "before" | "after", files: FileList | null) => {
    if (!procedure || !files?.length) return
    setIsUploadingGallery(true)
    try {
      const payload = type === "before" ? { before: Array.from(files) } : { after: Array.from(files) }
      const updated = await addProcedureImages(procedure.id, payload)
      setProcedure(updated)
    } finally {
      setIsUploadingGallery(false)
    }
  }

  useEffect(() => {
    loadProcedure()
    loadTemplates()
  }, [loadProcedure, loadTemplates])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/procedures">
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
            <p className="text-muted-foreground">Carregando dados do procedimento...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!procedure) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/procedures">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold text-foreground">Procedimento não encontrado</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Procedimento não encontrado</p>
              <p className="text-muted-foreground mb-4">O procedimento solicitado não existe ou foi removido.</p>
              <Link href="/procedures">
                <Button>Voltar para Lista de Procedimentos</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(procedure.category)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/procedures">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Scissors className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold text-foreground">{procedure.name}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Agendar
              </Button>
              <Link href={`/procedures/${procedure.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Informações do Procedimento</CardTitle>
                  <Badge variant={procedure.isActive ? "default" : "secondary"}>
                    {procedure.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Nome</p>
                  <p className="text-lg font-medium">{procedure.name}</p>
                </div>

                {procedure.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{procedure.description}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Categoria</p>
                      <Badge
                        variant="secondary"
                        style={{ backgroundColor: `${categoryInfo?.color}20`, color: categoryInfo?.color }}
                      >
                        {categoryInfo?.name || procedure.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duração</p>
                      <p className="font-medium">{formatDuration(procedure.durationMinutes)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Preço</p>
                    <p className="text-2xl font-bold text-primary">{formatPrice(procedure.price)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Details */}
            {categoryInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: categoryInfo.color }} />
                    Sobre a Categoria: {categoryInfo.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
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
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Sessão
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Histórico
                </Button>
                <Link href={`/procedures/${procedure.id}/edit`}>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Procedimento
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cadastrado em</span>
                  <span className="text-sm font-medium">
                    {new Date(procedure.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última atualização</span>
                  <span className="text-sm font-medium">
                    {new Date(procedure.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sessões realizadas</span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Receita gerada</span>
                  <span className="text-sm font-medium">R$ 0,00</span>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de Preço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{formatPrice(procedure.price)}</p>
                  <p className="text-sm text-muted-foreground">Valor por sessão</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor por minuto</span>
                    <span className="font-medium">{formatPrice(procedure.price / procedure.durationMinutes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">{formatDuration(procedure.durationMinutes)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Galeria antes e depois</CardTitle>
              <CardDescription>Registre imagens para acompanhar evolução</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Antes do procedimento</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(procedure.beforeGallery || []).map((src, index) => (
                      <div key={`before-${index}`} className="rounded-lg overflow-hidden border bg-muted aspect-square relative">
                        <Image src={src} alt="Antes do procedimento" fill className="object-cover" sizes="200px" />
                      </div>
                    ))}
                    {!procedure.beforeGallery?.length && (
                      <p className="text-xs text-muted-foreground col-span-2">Nenhuma imagem cadastrada.</p>
                    )}
                  </div>
                  <Label className="mt-2 block text-xs">Adicionar imagens (JPG/PNG)</Label>
                  <Input type="file" multiple accept="image/*" onChange={(e) => handleGalleryUpload("before", e.target.files)} />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Depois do procedimento</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(procedure.afterGallery || []).map((src, index) => (
                      <div key={`after-${index}`} className="rounded-lg overflow-hidden border bg-muted aspect-square relative">
                        <Image src={src} alt="Depois do procedimento" fill className="object-cover" sizes="200px" />
                      </div>
                    ))}
                    {!procedure.afterGallery?.length && (
                      <p className="text-xs text-muted-foreground col-span-2">Nenhuma imagem cadastrada.</p>
                    )}
                  </div>
                  <Label className="mt-2 block text-xs">Adicionar imagens (JPG/PNG)</Label>
                  <Input type="file" multiple accept="image/*" onChange={(e) => handleGalleryUpload("after", e.target.files)} />
                </div>
              </div>
              {isUploadingGallery && <p className="text-xs text-muted-foreground">Enviando imagens...</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anamneses relacionadas</CardTitle>
              <CardDescription>Defina quais formulários acompanharão este procedimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {templates.map((template) => (
                  <label key={template.id} className="flex items-start gap-3 text-sm">
                    <Checkbox
                      checked={selectedTemplates.has(template.id)}
                      onCheckedChange={() => toggleTemplate(template.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{template.title}</p>
                      <p className="text-xs text-muted-foreground">{template.category}</p>
                    </div>
                  </label>
                ))}
                {!templates.length && <p className="text-xs text-muted-foreground">Nenhum template cadastrado.</p>}
              </div>
              <Button type="button" disabled={isSavingTemplates} onClick={handleTemplatesSave}>
                <Upload className="h-4 w-4 mr-2" />
                Salvar vinculações
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
