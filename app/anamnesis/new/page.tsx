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
import { ArrowLeft, Save, Plus, Trash2, FileText } from "lucide-react"
import { createAnamnesisTemplate, type AnamnesisQuestion, type AnamnesisTemplate } from "@/lib/anamnesis"
import Link from "next/link"

export default function NewAnamnesisTemplatePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    isActive: true,
  })

  const [questions, setQuestions] = useState<AnamnesisQuestion[]>([
    {
      id: "1",
      type: "text" as const,
      question: "",
      required: false,
    },
  ])

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleQuestionChange = (index: number, field: keyof AnamnesisQuestion, value: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)))
  }

  const addQuestion = () => {
    const newQuestion: AnamnesisQuestion = {
      id: Date.now().toString(),
      type: "text",
      question: "",
      required: false,
    }
    setQuestions((prev) => [...prev, newQuestion])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const addOption = (questionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === questionIndex ? { ...q, options: [...(q.options || []), ""] } : q)),
    )
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options?.map((opt, oi) => (oi === optionIndex ? value : opt)),
            }
          : q,
      ),
    )
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options?.filter((_, oi) => oi !== optionIndex),
            }
          : q,
      ),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.title.trim()) {
      setError("Título é obrigatório")
      return
    }

    if (!formData.category.trim()) {
      setError("Categoria é obrigatória")
      return
    }

    const validQuestions = questions.filter((q) => q.question.trim())
    if (validQuestions.length === 0) {
      setError("Pelo menos uma pergunta é obrigatória")
      return
    }

    // Validate questions with options
    for (const question of validQuestions) {
      if (["select", "radio", "checkbox"].includes(question.type)) {
        if (!question.options || question.options.filter((opt) => opt.trim()).length < 2) {
          setError(`A pergunta "${question.question}" precisa ter pelo menos 2 opções`)
          return
        }
      }
    }

    setIsLoading(true)

    try {
      const templateData: Omit<AnamnesisTemplate, "id" | "createdAt" | "updatedAt"> = {
        ...formData,
        questions: validQuestions.map((q) => ({
          ...q,
          options: q.options?.filter((opt) => opt.trim()) || undefined,
        })),
      }

      await createAnamnesisTemplate(templateData)
      router.push("/anamnesis")
    } catch (err) {
      setError("Erro ao criar template. Tente novamente.")
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
            <Link href="/anamnesis">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Novo Template de Anamnese</h1>
            </div>
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

          {/* Template Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Template</CardTitle>
              <CardDescription>Dados básicos do template de anamnese</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    placeholder="Ex: Anamnese Facial Completa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleFormChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Facial">Facial</SelectItem>
                      <SelectItem value="Corporal">Corporal</SelectItem>
                      <SelectItem value="Capilar">Capilar</SelectItem>
                      <SelectItem value="Geral">Geral</SelectItem>
                      <SelectItem value="Pré-procedimento">Pré-procedimento</SelectItem>
                      <SelectItem value="Pós-procedimento">Pós-procedimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Descreva o propósito deste template..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Perguntas</CardTitle>
                  <CardDescription>Configure as perguntas da anamnese</CardDescription>
                </div>
                <Button type="button" onClick={addQuestion} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Pergunta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, questionIndex) => (
                <Card key={question.id} className="border-muted">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Pergunta {questionIndex + 1}</CardTitle>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Pergunta</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) => handleQuestionChange(questionIndex, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto Curto</SelectItem>
                            <SelectItem value="textarea">Texto Longo</SelectItem>
                            <SelectItem value="select">Lista Suspensa</SelectItem>
                            <SelectItem value="radio">Múltipla Escolha</SelectItem>
                            <SelectItem value="checkbox">Caixas de Seleção</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Categoria (opcional)</Label>
                        <Input
                          value={question.category || ""}
                          onChange={(e) => handleQuestionChange(questionIndex, "category", e.target.value)}
                          placeholder="Ex: Pele, Saúde, Cuidados"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Pergunta *</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => handleQuestionChange(questionIndex, "question", e.target.value)}
                        placeholder="Digite a pergunta..."
                        rows={2}
                      />
                    </div>

                    {["select", "radio", "checkbox"].includes(question.type) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Opções</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => addOption(questionIndex)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Opção
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(question.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                placeholder={`Opção ${optionIndex + 1}`}
                              />
                              {(question.options?.length || 0) > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(questionIndex, optionIndex)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`required-${question.id}`}
                        checked={question.required}
                        onChange={(e) => handleQuestionChange(questionIndex, "required", e.target.checked)}
                        className="rounded border-border"
                      />
                      <Label htmlFor={`required-${question.id}`}>Pergunta obrigatória</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/anamnesis">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Template"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
