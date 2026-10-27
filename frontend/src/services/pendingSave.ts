import type { SavedProgress } from './progress'

export interface PendingSave {
  username: string
  baseRevision: number
  progress: SavedProgress
  updatedAt: number
  conflicted?: boolean
  legacySnapshot?: string
  recoveredFrom?: { key: string; snapshot: string }
}

const LEGACY_PREFIX = 'unclaimed-pending-save-v1:'
const pageId = crypto.randomUUID()
const keyFor = (username: string) => `unclaimed-pending-save-v2:${username}:${pageId}`

const parsePending = (value: string | null, username: string): PendingSave | null => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<PendingSave>
    if (parsed.username !== username || !Number.isInteger(parsed.baseRevision)
      || (parsed.baseRevision ?? -1) < 0 || !parsed.progress
      || typeof parsed.updatedAt !== 'number' || !Number.isFinite(parsed.updatedAt)
      || typeof parsed.progress.keeperNumber !== 'string'
      || typeof parsed.progress.createdAt !== 'string'
      || !parsed.progress.records || typeof parsed.progress.records !== 'object') return null
    return parsed as PendingSave
  } catch { return null }
}

export const readPendingSave = (username: string, ownOnly = false): PendingSave | null => {
  try {
    const ownKey = keyFor(username)
    const own = parsePending(localStorage.getItem(ownKey), username)
    if (own) return own
    if (ownOnly) return null
    const legacy = localStorage.getItem(`${LEGACY_PREFIX}${username}`)
    const old = parsePending(legacy, username)
    if (old && legacy) return { ...old, legacySnapshot: legacy }
    let recovered: PendingSave | null = null
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (!key || key === ownKey || !key.startsWith(`unclaimed-pending-save-v2:${username}:`)) continue
      const snapshot = localStorage.getItem(key)
      const pending = parsePending(snapshot, username)
      if (pending && snapshot && (!recovered || pending.updatedAt > recovered.updatedAt)) {
        recovered = { ...pending, conflicted: true, recoveredFrom: { key, snapshot } }
      }
    }
    return recovered
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

export const clearPendingSave = (pending: PendingSave): boolean => {
  try {
    const key = keyFor(pending.username)
    const own = localStorage.getItem(key)
    if (own && own !== JSON.stringify(pending)) return false
    if (own) localStorage.removeItem(key)
    const legacyKey = `${LEGACY_PREFIX}${pending.username}`
    if (pending.legacySnapshot && localStorage.getItem(legacyKey) === pending.legacySnapshot) {
      localStorage.removeItem(legacyKey)
    }
    let source = pending.recoveredFrom
    while (source?.key.startsWith(`unclaimed-pending-save-v2:${pending.username}:`)) {
      if (localStorage.getItem(source.key) === source.snapshot) localStorage.removeItem(source.key)
      source = parsePending(source.snapshot, pending.username)?.recoveredFrom
    }
    return true
  } catch {
    return false
  }
}
