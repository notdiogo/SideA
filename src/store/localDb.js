// IndexedDB store: the on-device source of truth for the collection.
// Records are albums plus sync bookkeeping: { ...album, deletedAt: number|null, dirty: boolean }

const DB_NAME = 'side-a'
const DB_VERSION = 1

let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        db.createObjectStore('albums', { keyPath: 'id' })
        db.createObjectStore('meta')
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

async function run(storeName, mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const result = fn(tx.objectStore(storeName))
    tx.oncomplete = () => resolve(result instanceof IDBRequest ? result.result : undefined)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export function generateId() {
  return crypto.randomUUID()
}

export const getAllRecords = () => run('albums', 'readonly', s => s.getAll())

export const getRecord = (id) => run('albums', 'readonly', s => s.get(id))

export const putRecords = (records) =>
  run('albums', 'readwrite', s => { records.forEach(r => s.put(r)) })

export const getMeta = (key) => run('meta', 'readonly', s => s.get(key))

export const setMeta = (key, value) => run('meta', 'readwrite', s => { s.put(value, key) })

// Ask the browser not to evict our data under storage pressure (best effort).
export function requestPersistence() {
  try { navigator.storage?.persist?.() } catch { /* unsupported */ }
}
