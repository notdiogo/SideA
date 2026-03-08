const STORAGE_KEY = 'side-a:collection'

export function generateId() {
  return crypto.randomUUID()
}

export function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getById(id) {
  return getAll().find(album => album.id === id) ?? null
}

export function save(album) {
  const all = getAll()
  const idx = all.findIndex(a => a.id === album.id)
  const now = Date.now()

  if (idx >= 0) {
    all[idx] = { ...album, updatedAt: now }
  } else {
    all.unshift({ ...album, createdAt: now, updatedAt: now })
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return album
}

export function remove(id) {
  const filtered = getAll().filter(a => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
