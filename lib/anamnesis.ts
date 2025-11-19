import { readStorage, writeStorage } from "./storage"

export interface AnamnesisQuestion {
  id: string
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "date" | "number"
  question: string
  options?: string[]
  required: boolean
  category?: string
}

export interface AnamnesisTemplate {
  id: string
  title: string
  description: string
  category: string
  questions: AnamnesisQuestion[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AnamnesisResponse {
  id: string
  patientId: string
  templateId: string
  title: string
  responses: Record<string, any>
  status: "draft" | "completed" | "reviewed"
  createdBy: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface PatientAnamnesis {
  id: string
  patientId: string
  patientName: string
  templateId: string
  templateTitle: string
  responses: Record<string, any>
  status: "draft" | "completed" | "reviewed"
  createdAt: string
  updatedAt: string
}

const TEMPLATE_STORAGE_KEY = "jmestetica-anamnesis-templates"
const RESPONSE_STORAGE_KEY = "jmestetica-anamnesis-responses"

const seedTemplates: AnamnesisTemplate[] = [
  {
    id: "1",
    title: "Anamnese Facial Completa",
    description: "Avaliação completa para tratamentos faciais estéticos",
    category: "Facial",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      { id: "q1", type: "text", question: "Qual é o seu tipo de pele?", required: true, category: "Pele" },
      {
        id: "q2",
        type: "radio",
        question: "Você tem histórico de acne?",
        options: ["Sim", "Não", "Ocasionalmente"],
        required: true,
        category: "Pele",
      },
      {
        id: "q3",
        type: "checkbox",
        question: "Quais produtos você usa atualmente?",
        options: ["Protetor solar", "Hidratante", "Sérum", "Ácidos", "Retinol", "Outros"],
        required: false,
        category: "Cuidados",
      },
      { id: "q4", type: "textarea", question: "Descreva sua rotina de cuidados com a pele:", required: false },
    ],
  },
  {
    id: "2",
    title: "Anamnese Corporal",
    description: "Avaliação para tratamentos corporais e estéticos",
    category: "Corporal",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      { id: "q1", type: "number", question: "Qual é o seu peso atual (kg)?", required: true },
      { id: "q2", type: "number", question: "Qual é a sua altura (cm)?", required: true },
      {
        id: "q3",
        type: "checkbox",
        question: "Quais áreas você gostaria de tratar?",
        options: ["Abdômen", "Flancos", "Coxas", "Glúteos", "Braços", "Costas"],
        required: true,
      },
    ],
  },
]

const seedResponses: PatientAnamnesis[] = []

function loadTemplates(): AnamnesisTemplate[] {
  const stored = readStorage<AnamnesisTemplate[]>(TEMPLATE_STORAGE_KEY, [])
  if (!stored.length) {
    writeStorage(TEMPLATE_STORAGE_KEY, seedTemplates)
    return seedTemplates
  }
  return stored
}

function saveTemplates(data: AnamnesisTemplate[]) {
  writeStorage(TEMPLATE_STORAGE_KEY, data)
}

function loadResponses(): PatientAnamnesis[] {
  return readStorage<PatientAnamnesis[]>(RESPONSE_STORAGE_KEY, seedResponses)
}

function saveResponses(data: PatientAnamnesis[]) {
  writeStorage(RESPONSE_STORAGE_KEY, data)
}

export async function getAnamnesisTemplates(): Promise<AnamnesisTemplate[]> {
  return loadTemplates().filter((template) => template.isActive)
}

export async function getAnamnesisTemplate(id: string): Promise<AnamnesisTemplate | null> {
  return loadTemplates().find((template) => template.id === id) || null
}

export async function createAnamnesisTemplate(
  template: Omit<AnamnesisTemplate, "id" | "createdAt" | "updatedAt">,
): Promise<AnamnesisTemplate> {
  const now = new Date().toISOString()
  const newTemplate: AnamnesisTemplate = {
    ...template,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  const list = loadTemplates()
  list.push(newTemplate)
  saveTemplates(list)
  return newTemplate
}

export async function updateAnamnesisTemplate(
  id: string,
  template: Partial<Omit<AnamnesisTemplate, "id" | "createdAt" | "updatedAt">>,
): Promise<AnamnesisTemplate> {
  const list = loadTemplates()
  const index = list.findIndex((item) => item.id === id)
  if (index === -1) throw new Error("Template não encontrado")

  const updated: AnamnesisTemplate = {
    ...list[index],
    ...template,
    questions: template.questions || list[index].questions,
    updatedAt: new Date().toISOString(),
  }

  list[index] = updated
  saveTemplates(list)
  return updated
}

export async function deleteAnamnesisTemplate(id: string): Promise<void> {
  const list = loadTemplates().filter((template) => template.id !== id)
  saveTemplates(list)
}

export async function getPatientAnamneses(patientId: string): Promise<PatientAnamnesis[]> {
  return loadResponses().filter((response) => response.patientId === patientId)
}
