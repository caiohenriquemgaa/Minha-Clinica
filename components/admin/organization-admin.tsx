"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Organization {
  id: string
  name: string
  contact_email: string
  contact_phone: string | null
  plan_status: "trial" | "active" | "blocked"
  trial_end_at: string | null
  created_at: string
  updated_at: string
}

interface Props {
  initialOrganizations: Organization[]
}

const statusLabels: Record<Organization["plan_status"], string> = {
  trial: "Teste",
  active: "Ativa",
  blocked: "Bloqueada",
}

const statusVariants: Record<Organization["plan_status"], "secondary" | "default" | "destructive"> = {
  trial: "secondary",
  active: "default",
  blocked: "destructive",
}

export default function AdminOrganizationsPanel({ initialOrganizations }: Props) {
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [extendDays, setExtendDays] = useState<Record<string, number>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const refreshData = async () => {
    setIsRefreshing(true)
    const response = await fetch("/api/admin/organizations", { credentials: "include" })
    const data = await response.json()
    if (response.ok) {
      setOrganizations(data.organizations)
      setFeedback(null)
    } else {
      setFeedback(data.error ?? "Não foi possível atualizar a lista.")
    }
    setIsRefreshing(false)
  }

  const updateStatus = async (id: string, status: Organization["plan_status"]) => {
    setLoadingId(id)
    const response = await fetch(`/api/admin/organizations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "set_status", status }),
    })
    const data = await response.json()

    if (response.ok) {
      setOrganizations((prev) => prev.map((org) => (org.id === id ? { ...org, ...data.organization } : org)))
      setFeedback(null)
    } else {
      setFeedback(data.error ?? "Falha ao atualizar o status.")
    }
    setLoadingId(null)
  }

  const extendTrial = async (id: string) => {
    const days = extendDays[id] ?? 7
    setLoadingId(id)
    const response = await fetch(`/api/admin/organizations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "extend_trial", days }),
    })
    const data = await response.json()

    if (response.ok) {
      setOrganizations((prev) => prev.map((org) => (org.id === id ? { ...org, ...data.organization } : org)))
      setFeedback(null)
    } else {
      setFeedback(data.error ?? "Não foi possível atualizar o período de teste.")
    }
    setLoadingId(null)
  }

  const deleteOrganization = async (id: string) => {
    setLoadingId(id)
    const response = await fetch(`/api/admin/organizations/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    const data = await response.json()
    if (response.ok) {
      setOrganizations((prev) => prev.filter((org) => org.id !== id))
      setFeedback(null)
    } else {
      setFeedback(data.error ?? "Não foi possível remover a clínica.")
    }
    setLoadingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Utilize as ações abaixo para liberar, bloquear ou prorrogar o período de teste de cada clínica.
        </p>
        <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
          {isRefreshing ? "Atualizando..." : "Atualizar lista"}
        </Button>
      </div>

      {feedback && <p className="text-sm text-red-500">{feedback}</p>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clínica</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fim do teste</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <div className="font-medium">{org.name}</div>
                  <div className="text-xs text-muted-foreground">{org.id}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{org.contact_email}</div>
                  {org.contact_phone && <div className="text-xs text-muted-foreground">{org.contact_phone}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[org.plan_status]}>{statusLabels[org.plan_status]}</Badge>
                </TableCell>
                <TableCell>
                  {org.trial_end_at
                    ? format(new Date(org.trial_end_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(org.id, "trial")}
                        disabled={loadingId === org.id}
                      >
                        Marcar teste
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(org.id, "active")}
                        disabled={loadingId === org.id}
                      >
                        Ativar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(org.id, "blocked")}
                        disabled={loadingId === org.id}
                      >
                        Bloquear
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      <Input
                        type="number"
                        className="w-24 h-8"
                        value={extendDays[org.id] ?? 7}
                        onChange={(event) =>
                          setExtendDays((prev) => ({ ...prev, [org.id]: Number(event.target.value) }))
                        }
                      />
                      <Button size="sm" variant="outline" onClick={() => extendTrial(org.id)} disabled={loadingId === org.id}>
                        Adicionar dias
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => deleteOrganization(org.id)}
                      disabled={loadingId === org.id}
                    >
                      Remover acesso
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {organizations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Nenhuma clínica cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
