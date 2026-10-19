import type { SavedProgress } from './progress'

export interface PendingSave {
  username: string
  baseRevision: number
  progress: SavedProgress
  updatedAt: number
  conflicted?: boolean
}

const STORAGE_PREFIX = 'unclaimed-pending-save-v1:'
const keyFor = (username: string) => `${STORAGE_PREFIX}${username}`

export const readPendingSave = (username: string): PendingSave | null => {
  try {
    const value = localStorage.getItem(keyFor(username))
    if (!value) return null
    const parsed = JSON.parse(value) as Partial<PendingSave>
    if (parsed.username !== username || !Number.isInteger(parsed.baseRevision)
      || (parsed.baseRevision ?? -1) < 0 || !parsed.progress
      || typeof parsed.progress.keeperNumber !== 'string'
      || typeof parsed.progress.createdAt !== 'string'
      || !parsed.progress.records || typeof parsed.progress.records !== 'object') return null
    return parsed as PendingSave
  } catch {
    return null
  }
}

export const writePendingSave = (pending: PendingSave): boolean => {
  try {
    localStorage.setItem(keyFor(pending.username), JSON.stringify(pending))
    return true
  } catch {
    return false
  }
}

export const clearPendingSave = (username: string) => {
  try { localStorage.removeItem(keyFor(username)) } catch { /* The cloud save remains authoritative. */ }
}
