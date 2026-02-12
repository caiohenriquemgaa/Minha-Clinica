"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Plus, Trash2, FileText } from "lucide-react"
import Link from "next/link"
import {
  getAnamnesisTemplate,
  updateAnamnesisTemplate,
  type AnamnesisQuestion,
  type AnamnesisTemplate,
} from "@/lib/anamnesis"

export default function EditAnamnesisTemplatePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    isActive: true,
  })
  const [questions, setQuestions] = useState<AnamnesisQuestion[]>([])

  const loadTemplate = useCallback(async () => {
    setIsLoading(true)
    const template = await getAnamnesisTemplate(params.id)
    if (template) {
      setFormData({
        title: template.title,
        description: template.description,
        category: template.category,
        isActive: template.isActive,
      })
      setQuestions(template.questions)
    }
    setIsLoading(false)
  }, [params.id])

  useEffect(() => {
    loadTemplate()
  }, [loadTemplate])

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleQuestionChange = (index: number, field: keyof AnamnesisQuestion, value: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)))
  }

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "text",
        question: "",
        required: false,
      },
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const addOption = (index: number) => {
    setQuestions((prev) =>
      prev.map((question, i) => (i === index ? { ...question, options: [...(question.options || []), ""] } : question)),
    )
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i === questionIndex
          ? { ...question, options: question.options?.map((opt, oi) => (oi === optionIndex ? value : opt)) }
          : question,
      ),
    )
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i === questionIndex ? { ...question, options: question.options?.filter((_, oi) => oi !== optionIndex) } : question,
      ),
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.title.trim() || !formData.category.trim()) {
      setError("Título e categoria são obrigatórios.")
      return
    }
    const validQuestions = questions.filter((q) => q.question.trim())
    if (!validQuestions.length) {
      setError("Adicione pelo menos uma pergunta.")
      return
    }
    setSaving(true)
    try {
      await updateAnamnesisTemplate(params.id, {
        ...formData,
        questions: validQuestions.map((question) => ({
          ...question,
          options: question.options?.filter((opt) => opt.trim()),
        })),
      } as Partial<AnamnesisTemplate>)
      router.push("/anamnesis")
    } catch (err) {
      setError("Erro ao atualizar template.")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando template...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/anamnesis">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Editar Template</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informações do Template</CardTitle>
              <CardDescription>Atualize os dados principais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" value={formData.title} onChange={(e) => handleFormChange("title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleFormChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Facial">Facial</SelectItem>
                      <SelectItem value="Corporal">Corporal</SelectItem>
                      <SelectItem value="Capilar">Capilar</SelectItem>
                      <SelectItem value="Nutrição">Nutrição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Perguntas</CardTitle>
                <CardDescription>Personalize o formulário</CardDescription>
              </div>
              <Button type="button" onClick={addQuestion} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova pergunta
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Pergunta {index + 1}</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input value={question.question} onChange={(e) => handleQuestionChange(index, "question", e.target.value)} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={question.type} onValueChange={(value) => handleQuestionChange(index, "type", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto curto</SelectItem>
                          <SelectItem value="textarea">Texto longo</SelectItem>
                          <SelectItem value="select">Seleção</SelectItem>
                          <SelectItem value="radio">Múltipla escolha</SelectItem>
                          <SelectItem value="checkbox">Caixas de seleção</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="date">Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Obrigatória</Label>
                      <Select
                        value={question.required ? "true" : "false"}
                        onValueChange={(value) => handleQuestionChange(index, "required", value === "true")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {["select", "radio", "checkbox"].includes(question.type) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Opções</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => addOption(index)}>
                          <Plus className="h-3 w-3 mr-2" />
                          Opção
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(question.options || []).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Input value={option} onChange={(e) => updateOption(index, optionIndex, e.target.value)} />
                            <Button variant="ghost" size="icon" onClick={() => removeOption(index, optionIndex)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        {!question.options?.length && <p className="text-xs text-muted-foreground">Adicione ao menos 2 opções.</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Salvar alterações
          </Button>
        </form>
      </main>
    </div>
  )
}
