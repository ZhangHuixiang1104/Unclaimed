import type { ObjectRecord } from '../types/archive'

const STORAGE_KEY = 'long-march-archive-progress-v1'

export interface SavedProgress {
  keeperNumber: string
  records: Record<string, ObjectRecord>
  selectedObjectKey?: string
  createdAt: string
}

export const createKeeperNumber = () => {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `2026-${suffix}`
}

export const loadProgress = (): SavedProgress | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedProgress) : null
  } catch {
    return null
  }
}

export const saveProgress = (progress: SavedProgress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export const clearProgress = () => {
  localStorage.removeItem(STORAGE_KEY)
}
