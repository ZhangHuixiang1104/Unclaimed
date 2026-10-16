import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { archiveObjects } from '../data/objects'
import type { EvidenceLevel, ObjectRecord } from '../types/archive'
import { createKeeperNumber, type SavedProgress } from '../services/progress'

const emptyRecord = (): ObjectRecord => ({
  status: 'available',
  foundClueIds: [],
  classified: {},
  markerPositions: {},
  acceptedConclusionIds: [],
  rejectedClaimIds: [],
  screeningVerified: false,
  evidenceVerified: false,
  historyRevealed: false,
  historyRead: false,
})

const normalizeRecord = (record?: Partial<ObjectRecord>): ObjectRecord => ({
  ...emptyRecord(),
  ...record,
  foundClueIds: record?.foundClueIds ?? [],
  classified: record?.classified ?? {},
  markerPositions: record?.markerPositions ?? {},
  acceptedConclusionIds: record?.acceptedConclusionIds ?? [],
  rejectedClaimIds: record?.rejectedClaimIds ?? [],
})

export const useArchiveStore = defineStore('archive', () => {
  const keeperNumber = ref(createKeeperNumber())
  const records = ref<Record<string, ObjectRecord>>({})
  const selectedObjectKey = ref<string | undefined>()
  const keeperNote = ref('')
  const createdAt = ref(new Date().toISOString())

  const getRecord = (key: string) => records.value[key] ?? emptyRecord()
  const archivedCount = computed(() => archiveObjects.filter((item) => getRecord(item.key).status === 'archived').length)
  const progressPercent = computed(() => Math.round((archivedCount.value / archiveObjects.length) * 100))
  const endingUnlocked = computed(() => archivedCount.value === archiveObjects.length)

  const isObjectUnlocked = (key: string) => {
    const index = archiveObjects.findIndex((item) => item.key === key)
    if (index < 0) return false
    if (index === 0) return true
    return getRecord(archiveObjects[index - 1].key).status === 'archived'
  }

  const getObjectStatus = (key: string) => {
    const record = getRecord(key)
    if (record.status === 'archived') return record.status
    if (!isObjectUnlocked(key)) return 'locked' as const
    if (record.status === 'investigating') return record.status
    return isObjectUnlocked(key) ? 'available' as const : 'locked' as const
  }

  const nextObjectKey = computed(() => (
    archiveObjects.find((item) => getObjectStatus(item.key) === 'investigating')
      ?? archiveObjects.find((item) => getObjectStatus(item.key) === 'available')
  )?.key)

  const ensureRecord = (key: string) => {
    if (!records.value[key]) records.value[key] = emptyRecord()
    else records.value[key] = normalizeRecord(records.value[key])
    return records.value[key]
  }

  const startObject = (key: string) => {
    if (!isObjectUnlocked(key)) return false
    const record = ensureRecord(key)
    if (record.status !== 'archived') record.status = 'investigating'
    return true
  }

  const findClue = (key: string, clueId: string, position?: { x: number; y: number }) => {
    if (!isObjectUnlocked(key)) return
    const record = ensureRecord(key)
    if (record.status === 'archived') return
    if (!record.foundClueIds.includes(clueId)) record.foundClueIds.push(clueId)
    if (position) record.markerPositions[clueId] = position
  }

  const classify = (key: string, conclusionId: string, level: EvidenceLevel) => {
    if (!isObjectUnlocked(key)) return
    const record = ensureRecord(key)
    if (record.status === 'archived' || !record.screeningVerified) return
    record.classified[conclusionId] = level
    record.evidenceVerified = false
    record.historyRevealed = false
    record.historyRead = false
  }

  const reviewClaim = (key: string, claimId: string, supported: boolean) => {
    if (!isObjectUnlocked(key)) return
    const record = ensureRecord(key)
    if (record.status === 'archived') return
    const item = archiveObjects.find((entry) => entry.key === key)
    if (!item || record.foundClueIds.length !== item.clues.length) return
    if (!item.conclusions.some((entry) => entry.id === claimId) && !['decoy-same-time', 'decoy-owner'].includes(claimId)) return
    const target = supported ? record.acceptedConclusionIds : record.rejectedClaimIds
    const opposite = supported ? record.rejectedClaimIds : record.acceptedConclusionIds
    const oppositeIndex = opposite.indexOf(claimId)
    if (oppositeIndex >= 0) opposite.splice(oppositeIndex, 1)
    if (!target.includes(claimId)) target.push(claimId)
    record.screeningVerified = false
    record.classified = {}
    record.evidenceVerified = false
    record.historyRevealed = false
    record.historyRead = false
  }

  const verifyScreening = (key: string) => {
    const item = archiveObjects.find((entry) => entry.key === key)
    if (!item) return false
    const record = ensureRecord(key)
    if (record.status === 'archived') return true
    record.screeningVerified = record.foundClueIds.length === item.clues.length
      && item.conclusions.every((entry) => record.acceptedConclusionIds.includes(entry.id))
      && record.acceptedConclusionIds.length === item.conclusions.length
      && ['decoy-same-time', 'decoy-owner'].every((id) => record.rejectedClaimIds.includes(id))
    return record.screeningVerified
  }

  const verifyEvidence = (key: string, verified: boolean) => {
    const record = ensureRecord(key)
    if (record.status === 'archived') return
    const item = archiveObjects.find((entry) => entry.key === key)
    record.evidenceVerified = Boolean(verified && item && record.screeningVerified
      && record.foundClueIds.length === item.clues.length
      && item.conclusions.every((entry) => record.classified[entry.id] === entry.expectedLevel))
    if (!record.evidenceVerified) {
      record.historyRevealed = false
      record.historyRead = false
    }
  }

  const archiveObject = (key: string) => {
    const record = ensureRecord(key)
    if (record.evidenceVerified && record.historyRevealed && record.historyRead) record.status = 'archived'
  }

  const revealHistory = (key: string) => {
    const record = ensureRecord(key)
    if (record.evidenceVerified) record.historyRevealed = true
  }

  const markHistoryRead = (key: string) => {
    const record = ensureRecord(key)
    if (!record.evidenceVerified || !record.historyRevealed) return
    record.historyRead = true
  }

  const chooseObject = (key: string) => {
    selectedObjectKey.value = key
  }

  const reset = () => {
    keeperNumber.value = createKeeperNumber()
    records.value = {}
    selectedObjectKey.value = undefined
    keeperNote.value = ''
    createdAt.value = new Date().toISOString()
  }

  const exportProgress = (): SavedProgress => ({
    keeperNumber: keeperNumber.value,
    records: JSON.parse(JSON.stringify(records.value)) as Record<string, ObjectRecord>,
    selectedObjectKey: selectedObjectKey.value,
    keeperNote: keeperNote.value,
    createdAt: createdAt.value,
  })

  const replaceProgress = (progress: SavedProgress) => {
    keeperNumber.value = progress.keeperNumber
    records.value = Object.fromEntries(Object.entries(progress.records).map(([key, record]) => [key, normalizeRecord(record)]))
    selectedObjectKey.value = progress.selectedObjectKey
    keeperNote.value = progress.keeperNote ?? ''
    createdAt.value = progress.createdAt
  }

  return {
    keeperNumber,
    records,
    selectedObjectKey,
    keeperNote,
    createdAt,
    archivedCount,
    progressPercent,
    endingUnlocked,
    nextObjectKey,
    getRecord,
    getObjectStatus,
    isObjectUnlocked,
    startObject,
    findClue,
    classify,
    reviewClaim,
    verifyScreening,
    verifyEvidence,
    archiveObject,
    revealHistory,
    markHistoryRead,
    chooseObject,
    reset,
    exportProgress,
    replaceProgress,
  }
})
