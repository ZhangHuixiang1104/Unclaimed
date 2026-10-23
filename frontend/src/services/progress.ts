import type { ObjectRecord } from '../types/archive'

const LEGACY_PROGRESS_KEY = 'long-march-archive-progress-v1'

export interface SavedProgress {
  contentVersion?: string
  keeperNumber: string
  records: Record<string, ObjectRecord>
  legacyBatteryRecord?: ObjectRecord
  legacyShoesRecord?: ObjectRecord
  legacyBowlRecord?: ObjectRecord
  selectedObjectKey?: string
  keeperNote?: string
  createdAt: string
}

export const CONTENT_VERSION = 'independent-chapters-v6'

export const createKeeperNumber = () => {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `2026-${suffix}`
}

// Progress lives in memory while anonymous and on the server after sign-in.
// Remove only this project's old browser records when the new app first opens.
export const clearLegacyLocalRecords = () => {
  try {
    localStorage.removeItem(LEGACY_PROGRESS_KEY)
    localStorage.removeItem('archive-sound')
    sessionStorage.removeItem('unclaimed-home-intro')
    sessionStorage.removeItem('keeper-note')
    sessionStorage.removeItem('keeper-ticket-ready')
  } catch {
    // Storage may be unavailable in a private or restricted browser context.
  }
}
