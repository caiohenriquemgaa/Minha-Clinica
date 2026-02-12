import { readStorage, writeStorage } from "./storage"

export interface Professional {
  id: string
  name: string
  specialty: string
  phone?: string
  email?: string
  bio?: string
  color?: string
  avatarColor?: string
  workingHours?: string
  createdAt: string
  updatedAt: string
}

export interface ProfessionalFormData {
  name: string
  specialty: string
  phone?: string
  email?: string
  bio?: string
  color?: string
  avatarColor?: string
  workingHours?: string
}

const PROFESSIONALS_STORAGE_KEY = "jmestetica-professionals"

function loadProfessionals(): Professional[] {
  return readStorage<Professional[]>(PROFESSIONALS_STORAGE_KEY, [])
}

function saveProfessionals(data: Professional[]) {
  writeStorage(PROFESSIONALS_STORAGE_KEY, data)
}

export async function getProfessionals(): Promise<Professional[]> {
  return loadProfessionals().sort((a, b) => a.name.localeCompare(b.name))
}

export async function getProfessional(id: string): Promise<Professional | null> {
  return loadProfessionals().find((professional) => professional.id === id) || null
}

export async function createProfessional(data: ProfessionalFormData): Promise<Professional> {
  const now = new Date().toISOString()
  const professional: Professional = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  const list = loadProfessionals()
  list.push(professional)
  saveProfessionals(list)
  return professional
}

export async function updateProfessional(id: string, data: Partial<ProfessionalFormData>): Promise<Professional> {
  const list = loadProfessionals()
  const index = list.findIndex((professional) => professional.id === id)
  if (index === -1) throw new Error("Profissional não encontrado")

  const updated: Professional = {
    ...list[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  list[index] = updated
  saveProfessionals(list)
  return updated
}

export async function deleteProfessional(id: string): Promise<void> {
  const list = loadProfessionals().filter((professional) => professional.id !== id)
  saveProfessionals(list)
}
