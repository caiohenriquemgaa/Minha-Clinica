"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { getPatientAnamneses, type PatientAnamnesis } from "@/lib/anamnesis"
import Link from "next/link"

export default function AnamnesisResponsesPage() {
  const [responses, setResponses] = useState<PatientAnamnesis[]>([])
  const [filteredResponses, setFilteredResponses] = useState<PatientAnamnesis[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const loadResponses = useCallback(async () => {
    try {
      setIsLoading(true)
      // Mock: Load responses for all patients
      const data = await getPatientAnamneses("1") // In real app, load for all patients
      setResponses(data)
    } catch (error) {
      console.error("Erro ao carregar respostas:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const filterResponses = useCallback(() => {
    if (!searchTerm) {
      setFilteredResponses(responses)
      return
    }

    const filtered = responses.filter(
      (response) =>
        response.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.templateTitle.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredResponses(filtered)
  }, [responses, searchTerm])

  useEffect(() => {
    loadResponses()
  }, [loadResponses])

  useEffect(() => {
    filterResponses()
  }, [filterResponses])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "reviewed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "draft":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluída"
      case "reviewed":
        return "Revisada"
      case "draft":
        return "Rascunho"
      default:
        return "Desconhecido"
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
        return "default"
      case "reviewed":
        return "secondary"
      case "draft":
        return "outline"
      default:
        return "destructive"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-semibold text-foreground">Respostas de Anamnese</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando respostas...</p>
          </div>
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
              <Link href="/anamnesis">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold text-foreground">Respostas de Anamnese</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responses.length}</div>
              <p className="text-xs text-muted-foreground">Todas as anamneses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responses.filter((r) => r.status === "completed").length}</div>
              <p className="text-xs text-muted-foreground">Preenchidas pelos pacientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revisadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responses.filter((r) => r.status === "reviewed").length}</div>
              <p className="text-xs text-muted-foreground">Analisadas pelo profissional</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responses.filter((r) => r.status === "draft").length}</div>
              <p className="text-xs text-muted-foreground">Aguardando preenchimento</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Respostas</CardTitle>
            <CardDescription>Encontre respostas por paciente ou template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Responses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Respostas</CardTitle>
            <CardDescription>{filteredResponses.length} resposta(s) encontrada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm ? "Nenhuma resposta encontrada" : "Nenhuma resposta cadastrada"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResponses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>
                          <p className="font-medium">{response.patientName}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{response.templateTitle}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(response.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(response.status)}
                            {getStatusLabel(response.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(response.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(response.updatedAt).toLocaleDateString("pt-BR")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
