import { readStorage, writeStorage } from "./storage"

export interface Equipment {
  id: string
  name: string
  brand?: string
  model?: string
  stock: number
  unit: string
  location?: string
  minimumStock?: number
  notes?: string
  usageHistory?: EquipmentUsage[]
  createdAt: string
  updatedAt: string
}

export interface EquipmentUsage {
  id: string
  sessionId?: string
  description: string
  quantity: number
  createdAt: string
}

export interface EquipmentFormData {
  name: string
  brand?: string
  model?: string
  stock: number
  unit: string
  location?: string
  minimumStock?: number
  notes?: string
}

const EQUIPMENT_STORAGE_KEY = "jmestetica-equipment"

function loadEquipment(): Equipment[] {
  return readStorage<Equipment[]>(EQUIPMENT_STORAGE_KEY, [])
}

function saveEquipment(items: Equipment[]) {
  writeStorage(EQUIPMENT_STORAGE_KEY, items)
}

export async function getEquipment(): Promise<Equipment[]> {
  return loadEquipment().sort((a, b) => a.name.localeCompare(b.name))
}

export async function getEquipmentById(id: string): Promise<Equipment | null> {
  return loadEquipment().find((item) => item.id === id) || null
}

export async function createEquipment(data: EquipmentFormData): Promise<Equipment> {
  const now = new Date().toISOString()
  const equipment: Equipment = {
    id: crypto.randomUUID(),
    ...data,
    usageHistory: [],
    createdAt: now,
    updatedAt: now,
  }
  const list = loadEquipment()
  list.push(equipment)
  saveEquipment(list)
  return equipment
}

export async function updateEquipment(id: string, data: Partial<EquipmentFormData>): Promise<Equipment> {
  const list = loadEquipment()
  const index = list.findIndex((item) => item.id === id)
  if (index === -1) throw new Error("Equipamento não encontrado")

  const updated: Equipment = {
    ...list[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  list[index] = updated
  saveEquipment(list)
  return updated
}

export async function deleteEquipment(id: string): Promise<void> {
  const list = loadEquipment().filter((item) => item.id !== id)
  saveEquipment(list)
}

export async function adjustEquipmentStock(id: string, delta: number): Promise<Equipment> {
  const list = loadEquipment()
  const index = list.findIndex((item) => item.id === id)
  if (index === -1) throw new Error("Equipamento não encontrado")

  const newStock = Math.max(0, list[index].stock + delta)
  const usage: EquipmentUsage = {
    id: crypto.randomUUID(),
    description: delta < 0 ? "Consumo em procedimento" : "Reajuste manual",
    quantity: delta,
    createdAt: new Date().toISOString(),
  }

  const updated: Equipment = {
    ...list[index],
    stock: newStock,
    usageHistory: [...(list[index].usageHistory || []), usage],
    updatedAt: new Date().toISOString(),
  }

  list[index] = updated
  saveEquipment(list)
  return updated
}
