const memoryStore = new Map<string, string>()

function getBrowserStorage() {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch (error) {
    console.warn("LocalStorage indisponível:", error)
    return null
  }
}

export function readStorage<T>(key: string, fallback: T): T {
  const storage = getBrowserStorage()
  if (storage) {
    const raw = storage.getItem(key)
    if (!raw) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  const raw = memoryStore.get(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T) {
  const storage = getBrowserStorage()
  const serialized = JSON.stringify(value)
  if (storage) {
    try {
      storage.setItem(key, serialized)
    } catch (error) {
      console.warn("Não foi possível salvar no localStorage:", error)
    }
  } else {
    memoryStore.set(key, serialized)
  }
}

export function updateStorage<T>(key: string, updater: (prev: T) => T, fallback: T): T {
  const current = readStorage<T>(key, fallback)
  const updated = updater(current)
  writeStorage(key, updated)
  return updated
}
