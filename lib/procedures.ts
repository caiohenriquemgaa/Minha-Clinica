import { readStorage, writeStorage } from "./storage"

export interface Procedure {
  id: string
  name: string
  description?: string
  category: string
  durationMinutes: number
  price: number
  isActive: boolean
  beforeGallery?: string[]
  afterGallery?: string[]
  relatedAnamnesisIds?: string[]
  defaultEquipmentIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface ProcedureFormData {
  name: string
  description: string
  category: string
  durationMinutes: number
  price: number
  isActive: boolean
  relatedAnamnesisIds?: string[]
  defaultEquipmentIds?: string[]
}

export interface ProcedureCategory {
  id: string
  name: string
  description?: string
  color: string
}

const PROCEDURES_STORAGE_KEY = "jmestetica-procedures"

export const procedureCategories: ProcedureCategory[] = [
  { id: "facial", name: "Facial", description: "Tratamentos faciais estéticos", color: "#15803d" },
  { id: "corporal", name: "Corporal", description: "Tratamentos corporais e modelagem", color: "#0ea5e9" },
  { id: "capilar", name: "Capilar", description: "Tratamentos capilares e couro cabeludo", color: "#8b5cf6" },
  { id: "depilacao", name: "Depilação", description: "Remoção de pelos corporais", color: "#f59e0b" },
  { id: "massagem", name: "Massagem", description: "Massagens terapêuticas e relaxantes", color: "#84cc16" },
  { id: "consulta", name: "Consulta", description: "Consultas e avaliações", color: "#6b7280" },
]

function loadLocalProcedures(): Procedure[] {
  return readStorage<Procedure[]>(PROCEDURES_STORAGE_KEY, [])
}

function saveLocalProcedures(data: Procedure[]) {
  writeStorage(PROCEDURES_STORAGE_KEY, data)
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function getProcedures(): Promise<Procedure[]> {
  return loadLocalProcedures().sort((a, b) => a.name.localeCompare(b.name))
}

export async function getProcedure(id: string): Promise<Procedure | null> {
  return loadLocalProcedures().find((procedure) => procedure.id === id) || null
}

export async function createProcedure(data: ProcedureFormData): Promise<Procedure> {
  const now = new Date().toISOString()
  const procedure: Procedure = {
    id: crypto.randomUUID(),
    ...data,
    relatedAnamnesisIds: data.relatedAnamnesisIds || [],
    defaultEquipmentIds: data.defaultEquipmentIds || [],
    createdAt: now,
    updatedAt: now,
  }
  const list = loadLocalProcedures()
  list.push(procedure)
  saveLocalProcedures(list)
  return procedure
}

export async function updateProcedure(id: string, data: Partial<ProcedureFormData>): Promise<Procedure> {
  const list = loadLocalProcedures()
  const index = list.findIndex((procedure) => procedure.id === id)
  if (index === -1) throw new Error("Procedimento não encontrado")

  const updated: Procedure = {
    ...list[index],
    ...data,
    relatedAnamnesisIds: data.relatedAnamnesisIds ?? list[index].relatedAnamnesisIds,
    defaultEquipmentIds: data.defaultEquipmentIds ?? list[index].defaultEquipmentIds,
    updatedAt: new Date().toISOString(),
  }

  list[index] = updated
  saveLocalProcedures(list)
  return updated
}

export async function addProcedureImages(
  id: string,
  payload: { before?: File[]; after?: File[] },
): Promise<Procedure> {
  const list = loadLocalProcedures()
  const index = list.findIndex((procedure) => procedure.id === id)
  if (index === -1) throw new Error("Procedimento não encontrado")

  const beforeImages = list[index].beforeGallery || []
  const afterImages = list[index].afterGallery || []

  if (payload.before?.length) {
    for (const file of payload.before) beforeImages.push(await fileToDataUrl(file))
  }

  if (payload.after?.length) {
    for (const file of payload.after) afterImages.push(await fileToDataUrl(file))
  }

  const updated: Procedure = {
    ...list[index],
    beforeGallery: beforeImages,
    afterGallery: afterImages,
    updatedAt: new Date().toISOString(),
  }

  list[index] = updated
  saveLocalProcedures(list)
  return updated
}

export async function deleteProcedure(id: string): Promise<void> {
  const list = loadLocalProcedures().filter((procedure) => procedure.id !== id)
  saveLocalProcedures(list)
}

export async function getProceduresByCategory(category: string): Promise<Procedure[]> {
  return loadLocalProcedures().filter((procedure) => procedure.category === category && procedure.isActive)
}

export function getCategoryInfo(categoryId: string): ProcedureCategory | undefined {
  return procedureCategories.find((cat) => cat.id === categoryId)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price)
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours === 0) return `${minutes}min`
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}min`
}

export function getProcedureStats(procedures: Procedure[]) {
  const total = procedures.length
  const active = procedures.filter((p) => p.isActive).length
  const inactive = total - active
  const avgPrice = procedures.reduce((sum, procedure) => sum + procedure.price, 0) / (procedures.length || 1)

  return {
    total,
    active,
    inactive,
    avgPrice,
  }
}
