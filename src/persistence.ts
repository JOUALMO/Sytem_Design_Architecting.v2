import { validateWorkspace, type Workspace } from './domain'

const DB_NAME = 'architecture-lab-local'
const STORE = 'workspace'
const KEY = 'workspace-v1'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadWorkspace(): Promise<Workspace | null> {
  if (typeof indexedDB === 'undefined') {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    try { const value: unknown = JSON.parse(raw); return validateWorkspace(value) ? value : null } catch { return null }
  }
  try {
    const db = await openDatabase()
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return validateWorkspace(value) ? value : null
  } catch {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    try { const value: unknown = JSON.parse(raw); return validateWorkspace(value) ? value : null } catch { return null }
  }
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const serialized = JSON.stringify(workspace)
  if (typeof indexedDB === 'undefined') { localStorage.setItem(KEY, serialized); return }
  try {
    const db = await openDatabase()
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite')
        transaction.objectStore(STORE).put(workspace, KEY)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
      })
    } finally { db.close() }
  } catch (error) {
    try { localStorage.setItem(KEY, serialized) } catch { throw error }
  }
}
