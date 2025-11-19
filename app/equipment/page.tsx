"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Boxes, Plus, MoreHorizontal, Package } from "lucide-react"
import Link from "next/link"
import { getEquipment, type Equipment } from "@/lib/equipment"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([])

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    const data = await getEquipment()
    setItems(data)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold">Equipamentos e Estoque</h1>
              <p className="text-sm text-muted-foreground">Controle o material utilizado nos procedimentos</p>
            </div>
          </div>
          <Link href="/equipment/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo item
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estoque</CardTitle>
            <CardDescription>Veja o saldo e reposições necessárias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-semibold">{item.name}</div>
                        {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.brand || "--"}</TableCell>
                      <TableCell>
                        <Badge variant={item.stock <= (item.minimumStock || 0) ? "destructive" : "secondary"}>
                          {item.stock} {item.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.location || "Estoque"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/equipment/${item.id}`}>
                                <Package className="h-4 w-4 mr-2" />
                                Abrir
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Nenhum item cadastrado.
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
