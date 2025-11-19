"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Scissors, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Clock, DollarSign, ArrowLeft } from "lucide-react"
import {
  getProcedures,
  getCategoryInfo,
  formatPrice,
  formatDuration,
  getProcedureStats,
  procedureCategories,
  type Procedure,
} from "@/lib/procedures"
import Link from "next/link"

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  const loadProcedures = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getProcedures()
      setProcedures(data)
    } catch (error) {
      console.error("Erro ao carregar procedimentos:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const filterProcedures = useCallback(() => {
    let filtered = procedures

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (procedure) =>
          procedure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          procedure.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((procedure) => procedure.category === categoryFilter)
    }

    // Filter by status
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"
      filtered = filtered.filter((procedure) => procedure.isActive === isActive)
    }

    setFilteredProcedures(filtered)
  }, [procedures, searchTerm, categoryFilter, statusFilter])

  useEffect(() => {
    loadProcedures()
  }, [loadProcedures])

  useEffect(() => {
    filterProcedures()
  }, [filterProcedures])

  const stats = getProcedureStats(procedures)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold text-foreground">Procedimentos</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando procedimentos...</p>
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Scissors className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold text-foreground">Procedimentos</h1>
              </div>
            </div>
            <Link href="/procedures/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Procedimento
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Procedimentos</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} ativos, {stats.inactive} inativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.avgPrice)}</div>
              <p className="text-xs text-muted-foreground">Média dos procedimentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(Math.round(stats.avgDuration))}</div>
              <p className="text-xs text-muted-foreground">Tempo médio de sessão</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
              <Badge variant="secondary">{procedureCategories.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{procedureCategories.length}</div>
              <p className="text-xs text-muted-foreground">Tipos de tratamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
            <CardDescription>Encontre procedimentos por nome, categoria ou status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar procedimentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {procedureCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Apenas ativos</SelectItem>
                  <SelectItem value="inactive">Apenas inativos</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setStatusFilter("all")
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Procedures Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Procedimentos</CardTitle>
            <CardDescription>{filteredProcedures.length} procedimento(s) encontrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcedures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Scissors className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                              ? "Nenhum procedimento encontrado com os filtros aplicados"
                              : "Nenhum procedimento cadastrado"}
                          </p>
                          {!searchTerm && categoryFilter === "all" && statusFilter === "all" && (
                            <Link href="/procedures/new">
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Cadastrar Primeiro Procedimento
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProcedures.map((procedure) => {
                      const categoryInfo = getCategoryInfo(procedure.category)
                      return (
                        <TableRow key={procedure.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{procedure.name}</p>
                              {procedure.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">{procedure.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: `${categoryInfo?.color}20`, color: categoryInfo?.color }}
                            >
                              {categoryInfo?.name || procedure.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDuration(procedure.durationMinutes)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatPrice(procedure.price)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={procedure.isActive ? "default" : "secondary"}>
                              {procedure.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(procedure.createdAt).toLocaleDateString("pt-BR")}
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
                                <DropdownMenuItem asChild>
                                  <Link href={`/procedures/${procedure.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Detalhes
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/procedures/${procedure.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
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
