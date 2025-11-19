"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, UserCog, Phone, Mail, MoreHorizontal, Eye } from "lucide-react"
import Link from "next/link"
import { getProfessionals, type Professional } from "@/lib/professionals"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])

  useEffect(() => {
    loadProfessionals()
  }, [])

  const loadProfessionals = async () => {
    const data = await getProfessionals()
    setProfessionals(data)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold">Profissionais</h1>
              <p className="text-sm text-muted-foreground">Equipe disponível para agendamentos</p>
            </div>
          </div>
          <Link href="/professionals/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Profissional
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Equipe cadastrada</CardTitle>
            <CardDescription>Gerencie quem pode receber agendamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionals.map((professional) => (
                    <TableRow key={professional.id}>
                      <TableCell>
                        <div className="font-semibold">{professional.name}</div>
                        {professional.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {professional.email}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{professional.specialty}</Badge>
                      </TableCell>
                      <TableCell>
                        {professional.phone ? (
                          <p className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {professional.phone}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem telefone</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{professional.workingHours || "--"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/professionals/${professional.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!professionals.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Nenhum profissional cadastrado ainda.
                      </TableCell>
                    </TableRow>
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
