import { isSupabaseEnabled } from "./data-source"
import { readStorage, writeStorage } from "./storage"
import { getSupabaseBrowserClient } from "./supabase-client"

export interface Patient {
  id: string
  name: string
  email?: string
  phone?: string
  cpf?: string
  birthDate?: string
  gender?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalHistory?: string
  allergies?: string
  medications?: string
  beforeImage?: string
  afterImage?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface PatientFormData {
  name: string
  email: string
  phone: string
  cpf: string
  birthDate: string
  gender: string
  address: string
  city: string
  state: string
  zipCode: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalHistory: string
  allergies: string
  medications: string
  beforeImage?: File | null
  afterImage?: File | null
}

const PATIENTS_STORAGE_KEY = "jmestetica-patients"

const useSupabase = isSupabaseEnabled()

function loadLocalPatients(): Patient[] {
  return readStorage<Patient[]>(PATIENTS_STORAGE_KEY, [])
}

function saveLocalPatients(patients: Patient[]) {
  writeStorage(PATIENTS_STORAGE_KEY, patients)
}

async function fileToDataUrl(file: File | null | undefined) {
  if (!file) return undefined
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadImageToSupabase(file: File, suffix: string) {
  const supabase = getSupabaseBrowserClient()
  const path = `patients/${Date.now()}_${suffix}_${file.name}`

  const { data, error } = await supabase.storage.from("patient-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) throw new Error(`Erro ao fazer upload da imagem: ${error.message}`)

  const {
    data: { publicUrl },
  } = supabase.storage.from("patient-images").getPublicUrl(data.path)

  return publicUrl
}

function normalizePatientPayload(formData: PatientFormData) {
  return {
    name: formData.name.trim(),
    email: formData.email || undefined,
    phone: formData.phone || undefined,
    cpf: formData.cpf || undefined,
    birthDate: formData.birthDate || undefined,
    gender: formData.gender || undefined,
    address: formData.address || undefined,
    city: formData.city || undefined,
    state: formData.state || undefined,
    zipCode: formData.zipCode || undefined,
    emergencyContactName: formData.emergencyContactName || undefined,
    emergencyContactPhone: formData.emergencyContactPhone || undefined,
    medicalHistory: formData.medicalHistory || undefined,
    allergies: formData.allergies || undefined,
    medications: formData.medications || undefined,
  }
}

export async function getPatients(): Promise<Patient[]> {
  if (useSupabase) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false })
    if (error) throw new Error(`Erro ao buscar pacientes: ${error.message}`)
    return data || []
  }

  return loadLocalPatients().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getPatient(id: string): Promise<Patient | null> {
  if (useSupabase) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("patients").select("*").eq("id", id).single()
    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Erro ao buscar paciente: ${error.message}`)
    }
    return data
  }

  return loadLocalPatients().find((patient) => patient.id === id) || null
}

export async function createPatient(formData: PatientFormData): Promise<Patient> {
  if (useSupabase) {
    const supabase = getSupabaseBrowserClient()
    const payload: any = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      cpf: formData.cpf || null,
      birth_date: formData.birthDate || null,
      gender: formData.gender || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zipCode || null,
      emergency_contact_name: formData.emergencyContactName || null,
      emergency_contact_phone: formData.emergencyContactPhone || null,
      medical_history: formData.medicalHistory || null,
      allergies: formData.allergies || null,
      medications: formData.medications || null,
    }

    if (formData.beforeImage) payload.before_image = await uploadImageToSupabase(formData.beforeImage, "before")
    if (formData.afterImage) payload.after_image = await uploadImageToSupabase(formData.afterImage, "after")

    const { data, error } = await supabase.from("patients").insert([payload]).select().single()
    if (error) throw new Error(`Erro ao criar paciente: ${error.message}`)
    return data
  }

  const now = new Date().toISOString()
  const patient: Patient = {
    id: crypto.randomUUID(),
    ...normalizePatientPayload(formData),
    beforeImage: await fileToDataUrl(formData.beforeImage),
    afterImage: await fileToDataUrl(formData.afterImage),
    createdAt: now,
    updatedAt: now,
  }

  const patients = loadLocalPatients()
  patients.unshift(patient)
  saveLocalPatients(patients)
  return patient
}

export async function updatePatient(id: string, formData: Partial<PatientFormData>): Promise<Patient> {
  if (useSupabase) {
    const supabase = getSupabaseBrowserClient()
    const payload: any = {}

    if (formData.name !== undefined) payload.name = formData.name
    if (formData.email !== undefined) payload.email = formData.email || null
    if (formData.phone !== undefined) payload.phone = formData.phone || null
    if (formData.cpf !== undefined) payload.cpf = formData.cpf || null
    if (formData.birthDate !== undefined) payload.birth_date = formData.birthDate || null
    if (formData.gender !== undefined) payload.gender = formData.gender || null
    if (formData.address !== undefined) payload.address = formData.address || null
    if (formData.city !== undefined) payload.city = formData.city || null
    if (formData.state !== undefined) payload.state = formData.state || null
    if (formData.zipCode !== undefined) payload.zip_code = formData.zipCode || null
    if (formData.emergencyContactName !== undefined)
      payload.emergency_contact_name = formData.emergencyContactName || null
    if (formData.emergencyContactPhone !== undefined)
      payload.emergency_contact_phone = formData.emergencyContactPhone || null
    if (formData.medicalHistory !== undefined) payload.medical_history = formData.medicalHistory || null
    if (formData.allergies !== undefined) payload.allergies = formData.allergies || null
    if (formData.medications !== undefined) payload.medications = formData.medications || null

    if (formData.beforeImage) payload.before_image = await uploadImageToSupabase(formData.beforeImage, "before")
    if (formData.afterImage) payload.after_image = await uploadImageToSupabase(formData.afterImage, "after")

    const { data, error } = await supabase.from("patients").update(payload).eq("id", id).select().single()
    if (error) throw new Error(`Erro ao atualizar paciente: ${error.message}`)
    return data
  }

  const patients = loadLocalPatients()
  const index = patients.findIndex((patient) => patient.id === id)
  if (index === -1) throw new Error("Paciente não encontrado")

  const updated: Patient = {
    ...patients[index],
    ...normalizePatientPayload(formData as PatientFormData),
    beforeImage: formData.beforeImage ? await fileToDataUrl(formData.beforeImage) : patients[index].beforeImage,
    afterImage: formData.afterImage ? await fileToDataUrl(formData.afterImage) : patients[index].afterImage,
    updatedAt: new Date().toISOString(),
  }

  patients[index] = updated
  saveLocalPatients(patients)
  return updated
}

export async function deletePatient(id: string): Promise<void> {
  if (useSupabase) {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from("patients").delete().eq("id", id)
    if (error) throw new Error(`Erro ao deletar paciente: ${error.message}`)
    return
  }

  const patients = loadLocalPatients().filter((patient) => patient.id !== id)
  saveLocalPatients(patients)
}

export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function formatPhone(phone?: string) {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  const match = digits.match(/(\d{2})(\d{4,5})(\d{4})/)
  if (!match) return phone
  return `(${match[1]}) ${match[2]}-${match[3]}`
}

export function formatCPF(cpf?: string) {
  if (!cpf) return ""
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11) return cpf
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function validateCPF(cpf: string): boolean {
  if (!cpf) return false
  const cleanCPF = cpf.replace(/\D/g, "")
  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  let firstDigit = 11 - (sum % 11)
  if (firstDigit >= 10) firstDigit = 0
  if (firstDigit !== parseInt(cleanCPF.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  let secondDigit = 11 - (sum % 11)
  if (secondDigit >= 10) secondDigit = 0
  return secondDigit === parseInt(cleanCPF.charAt(10))
}
