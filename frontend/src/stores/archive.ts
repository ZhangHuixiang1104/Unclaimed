import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { archiveObjects } from '../data/objects'
import type { EvidenceLevel, ObjectRecord } from '../types/archive'
import { CONTENT_VERSION, createKeeperNumber, type SavedProgress } from '../services/progress'

const emptyRecord = (): ObjectRecord => ({
  status: 'available',
  foundClueIds: [],
  completedInteractions: [],
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
  completedInteractions: record?.completedInteractions ?? [],
  classified: record?.classified ?? {},
  markerPositions: record?.markerPositions ?? {},
  acceptedConclusionIds: record?.acceptedConclusionIds ?? [],
  rejectedClaimIds: record?.rejectedClaimIds ?? [],
})
const listInteractionsReady = (record: ObjectRecord) => record.completedInteractions.includes('list-pieces-assembled')
  && record.completedInteractions.includes('list-mud-cleared')

export const useArchiveStore = defineStore('archive', () => {
  const keeperNumber = ref(createKeeperNumber())
  const records = ref<Record<string, ObjectRecord>>({})
  const legacyBatteryRecord = ref<ObjectRecord | undefined>()
  const legacyShoesRecord = ref<ObjectRecord | undefined>()
  const legacyBowlRecord = ref<ObjectRecord | undefined>()
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
    const item = archiveObjects.find((entry) => entry.key === key)
    if (!item?.clues.some((clue) => clue.id === clueId)) return
    const record = ensureRecord(key)
    if (record.status === 'archived') return
    if (key === 'battery') {
      if (clueId === 'battery-old-band' && !record.completedInteractions.includes('battery-band-lifted')) return
      if (clueId === 'battery-terminal' && !record.completedInteractions.includes('battery-right-viewed')) return
      if ((clueId === 'battery-note' || clueId === 'battery-blank') && !record.completedInteractions.includes('battery-lid-opened')) return
      if (clueId === 'battery-blank' && !record.foundClueIds.includes('battery-note')) return
    }
    if (key === 'shoes') {
      if (!record.completedInteractions.includes('shoes-separated')) return
      if (clueId === 'shoes-measure' && !record.completedInteractions.includes('shoes-measured')) return
      if (clueId === 'shoes-repair' && !['shoes-light-on', 'shoes-large-repair-viewed', 'shoes-small-repair-viewed'].every((id) => record.completedInteractions.includes(id))) return
      if (clueId === 'shoes-wear' && !['shoes-large-sole-viewed', 'shoes-small-sole-viewed', 'shoes-wear-traced'].every((id) => record.completedInteractions.includes(id))) return
      if (clueId === 'shoes-cord' && (!record.completedInteractions.includes('shoes-cord-lifted')
        || !['shoes-measure', 'shoes-repair', 'shoes-wear'].every((id) => record.foundClueIds.includes(id)))) return
    }
    if (key === 'bowl') {
      if (clueId === 'bowl-unwrapped' && !record.completedInteractions.includes('bowl-wrapper-opened')) return
      if (clueId === 'bowl-rim' && (!record.foundClueIds.includes('bowl-unwrapped')
        || !['bowl-rotated', 'bowl-light-on'].every((id) => record.completedInteractions.includes(id)))) return
      if (clueId === 'bowl-marks' && (!record.foundClueIds.includes('bowl-rim')
        || !['bowl-base-viewed', 'bowl-light-on'].every((id) => record.completedInteractions.includes(id)))) return
      if (clueId === 'bowl-paper' && (!record.foundClueIds.includes('bowl-marks')
        || !record.completedInteractions.includes('bowl-paper-turned'))) return
    }
    if (key === 'list') {
      if (!listInteractionsReady(record) || item?.clues.find((clue) => !record.foundClueIds.includes(clue.id))?.id !== clueId) return
    }
    if (!record.foundClueIds.includes(clueId)) record.foundClueIds.push(clueId)
    if (position) record.markerPositions[clueId] = position
  }

  const completeInteraction = (key: string, interactionId: string) => {
    if (!isObjectUnlocked(key)) return
    const record = ensureRecord(key)
    if (record.status === 'archived') return
    const historyMatch = interactionId.match(/^(list|map|battery|shoes|bowl)-history-0([1-4])$/)
    if (interactionId.includes('-history-')) {
      if (!historyMatch || historyMatch[1] !== key || !record.historyRevealed) return
    }
    if (key === 'list' && interactionId === 'list-mud-cleared' && !record.completedInteractions.includes('list-pieces-assembled')) return
    if (key === 'battery' && !['battery-band-lifted', 'battery-right-viewed', 'battery-lid-opened',
      'battery-history-01', 'battery-history-02', 'battery-history-03', 'battery-history-04'].includes(interactionId)) return
    if (key === 'shoes') {
      const allowed = ['shoes-separated', 'shoes-measured', 'shoes-light-on', 'shoes-large-repair-viewed', 'shoes-small-repair-viewed', 'shoes-large-sole-viewed',
        'shoes-small-sole-viewed', 'shoes-wear-traced', 'shoes-cord-lifted',
        'shoes-history-01', 'shoes-history-02', 'shoes-history-03', 'shoes-history-04']
      if (!allowed.includes(interactionId)) return
      if (interactionId === 'shoes-measured' && !record.completedInteractions.includes('shoes-separated')) return
      if (interactionId === 'shoes-wear-traced' && !['shoes-large-sole-viewed', 'shoes-small-sole-viewed'].every((id) => record.completedInteractions.includes(id))) return
      if (interactionId === 'shoes-cord-lifted' && !['shoes-measure', 'shoes-repair', 'shoes-wear'].every((id) => record.foundClueIds.includes(id))) return
    }
    if (key === 'bowl') {
      const allowed = ['bowl-wrapper-opened', 'bowl-rotated', 'bowl-light-on', 'bowl-base-viewed', 'bowl-paper-turned',
        'bowl-history-01', 'bowl-history-02', 'bowl-history-03', 'bowl-history-04']
      if (!allowed.includes(interactionId)) return
      if (['bowl-rotated', 'bowl-light-on', 'bowl-base-viewed'].includes(interactionId)
        && !record.foundClueIds.includes('bowl-unwrapped')) return
      if (interactionId === 'bowl-paper-turned' && !['bowl-unwrapped', 'bowl-rim', 'bowl-marks'].every((id) => record.foundClueIds.includes(id))) return
    }
    if (!record.completedInteractions.includes(interactionId)) record.completedInteractions.push(interactionId)
  }

  const completeListNarrative = () => {
    const record = ensureRecord('list')
    if (record.status === 'archived') return true
    const clueIds = archiveObjects.find((item) => item.key === 'list')?.clues.map((clue) => clue.id) ?? []
    if (!listInteractionsReady(record) || clueIds.length !== 3
      || clueIds.some((clueId, index) => record.foundClueIds[index] !== clueId)) return false
    if (!record.completedInteractions.includes('list-story-saved')) record.completedInteractions.push('list-story-saved')
    record.screeningVerified = true
    record.evidenceVerified = true
    return true
  }

  const completeMapNarrative = () => {
    if (!isObjectUnlocked('map')) return false
    const record = ensureRecord('map')
    if (record.status === 'archived') return true
    const clueIds = archiveObjects.find((item) => item.key === 'map')?.clues.map((clue) => clue.id) ?? []
    if (clueIds.length !== 4 || clueIds.some((id) => !record.foundClueIds.includes(id))
      || !record.completedInteractions.includes('map-back-viewed')
      || !record.completedInteractions.includes('map-caption-supported')) return false
    if (!record.completedInteractions.includes('map-story-saved')) record.completedInteractions.push('map-story-saved')
    record.screeningVerified = true
    record.evidenceVerified = true
    return true
  }

  const completeBatteryNarrative = (captionIndex: number) => {
    if (!isObjectUnlocked('battery') || captionIndex !== 0) return false
    const record = ensureRecord('battery')
    if (record.status === 'archived') return true
    const clueIds = archiveObjects.find((item) => item.key === 'battery')?.clues.map((clue) => clue.id) ?? []
    if (clueIds.length !== 4 || clueIds.some((id) => !record.foundClueIds.includes(id))
      || !record.completedInteractions.includes('battery-band-lifted')
      || !record.completedInteractions.includes('battery-right-viewed')
      || !record.completedInteractions.includes('battery-lid-opened')) return false
    if (!record.completedInteractions.includes('battery-story-saved')) record.completedInteractions.push('battery-story-saved')
    record.screeningVerified = true
    record.evidenceVerified = true
    return true
  }

  const completeShoesNarrative = (captionIndex: number) => {
    if (!isObjectUnlocked('shoes') || captionIndex !== 0) return false
    const record = ensureRecord('shoes')
    if (record.status === 'archived') return true
    const clueIds = archiveObjects.find((item) => item.key === 'shoes')?.clues.map((clue) => clue.id) ?? []
    if (clueIds.length !== 4 || clueIds.some((id) => !record.foundClueIds.includes(id))
      || !['shoes-separated', 'shoes-measured', 'shoes-light-on', 'shoes-large-repair-viewed', 'shoes-small-repair-viewed', 'shoes-large-sole-viewed',
        'shoes-small-sole-viewed', 'shoes-wear-traced', 'shoes-cord-lifted'].every((id) => record.completedInteractions.includes(id))) return false
    if (!record.completedInteractions.includes('shoes-story-saved')) record.completedInteractions.push('shoes-story-saved')
    record.screeningVerified = true
    record.evidenceVerified = true
    return true
  }

  const completeBowlNarrative = (captionIndex: number) => {
    if (!isObjectUnlocked('bowl') || captionIndex !== 0) return false
    const record = ensureRecord('bowl')
    if (record.status === 'archived') return true
    const clueIds = archiveObjects.find((item) => item.key === 'bowl')?.clues.map((clue) => clue.id) ?? []
    if (clueIds.length !== 4 || clueIds.some((id) => !record.foundClueIds.includes(id))
      || !['bowl-wrapper-opened', 'bowl-rotated', 'bowl-light-on', 'bowl-base-viewed', 'bowl-paper-turned']
        .every((id) => record.completedInteractions.includes(id))) return false
    if (!record.completedInteractions.includes('bowl-story-saved')) record.completedInteractions.push('bowl-story-saved')
    record.screeningVerified = true
    record.evidenceVerified = true
    return true
  }

  const classify = (key: string, conclusionId: string, level: EvidenceLevel) => {
    if (key === 'map' || key === 'battery' || key === 'shoes' || key === 'bowl') return
    if (!isObjectUnlocked(key)) return
    const record = ensureRecord(key)
    if (record.status === 'archived' || !record.screeningVerified) return
    record.classified[conclusionId] = level
    record.evidenceVerified = false
    record.historyRevealed = false
    record.historyRead = false
  }

  const reviewClaim = (key: string, claimId: string, supported: boolean) => {
    if (key === 'map' || key === 'battery' || key === 'shoes' || key === 'bowl') return
    if (!isObjectUnlocked(key)) return
    const record = ensureRecord(key)
    if (record.status === 'archived') return
    const item = archiveObjects.find((entry) => entry.key === key)
    if (!item || record.foundClueIds.length !== item.clues.length) return
    if (!item.conclusions.some((entry) => entry.id === claimId) && !item.screeningDecoys.some((entry) => entry.id === claimId)) return
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
    if (key === 'map' || key === 'battery' || key === 'shoes' || key === 'bowl') return false
    const item = archiveObjects.find((entry) => entry.key === key)
    if (!item) return false
    const record = ensureRecord(key)
    if (record.status === 'archived') return true
    record.screeningVerified = record.foundClueIds.length === item.clues.length
      && (key !== 'list' || listInteractionsReady(record))
      && item.conclusions.every((entry) => record.acceptedConclusionIds.includes(entry.id))
      && record.acceptedConclusionIds.length === item.conclusions.length
      && item.screeningDecoys.every((entry) => record.rejectedClaimIds.includes(entry.id))
    return record.screeningVerified
  }

  const verifyEvidence = (key: string, verified: boolean) => {
    if (key === 'map' || key === 'battery' || key === 'shoes' || key === 'bowl') return
    const record = ensureRecord(key)
    if (record.status === 'archived') return
    const item = archiveObjects.find((entry) => entry.key === key)
    record.evidenceVerified = Boolean(verified && item && record.screeningVerified
      && (key !== 'list' || listInteractionsReady(record))
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
    if (['list', 'map', 'battery', 'shoes', 'bowl'].includes(key) && ![1, 2, 3, 4].every((index) => record.completedInteractions.includes(`${key}-history-0${index}`))) return
    record.historyRead = true
  }

  const chooseObject = (key: string) => {
    selectedObjectKey.value = key
  }

  const reset = () => {
    keeperNumber.value = createKeeperNumber()
    records.value = {}
    legacyBatteryRecord.value = undefined
    legacyShoesRecord.value = undefined
    legacyBowlRecord.value = undefined
    selectedObjectKey.value = undefined
    keeperNote.value = ''
    createdAt.value = new Date().toISOString()
  }

  const exportProgress = (): SavedProgress => ({
    contentVersion: CONTENT_VERSION,
    keeperNumber: keeperNumber.value,
    records: JSON.parse(JSON.stringify(records.value)) as Record<string, ObjectRecord>,
    ...(legacyBatteryRecord.value ? { legacyBatteryRecord: JSON.parse(JSON.stringify(legacyBatteryRecord.value)) as ObjectRecord } : {}),
    ...(legacyShoesRecord.value ? { legacyShoesRecord: JSON.parse(JSON.stringify(legacyShoesRecord.value)) as ObjectRecord } : {}),
    ...(legacyBowlRecord.value ? { legacyBowlRecord: JSON.parse(JSON.stringify(legacyBowlRecord.value)) as ObjectRecord } : {}),
    selectedObjectKey: selectedObjectKey.value,
    keeperNote: keeperNote.value,
    createdAt: createdAt.value,
  })

  const replaceProgress = (progress: SavedProgress) => {
    keeperNumber.value = progress.keeperNumber
    const currentMapClues = new Set(archiveObjects.find((item) => item.key === 'map')?.clues.map((clue) => clue.id) ?? [])
    const currentBatteryClues = new Set(archiveObjects.find((item) => item.key === 'battery')?.clues.map((clue) => clue.id) ?? [])
    const currentShoesClues = new Set(archiveObjects.find((item) => item.key === 'shoes')?.clues.map((clue) => clue.id) ?? [])
    const currentBowlClues = new Set(archiveObjects.find((item) => item.key === 'bowl')?.clues.map((clue) => clue.id) ?? [])
    legacyBatteryRecord.value = progress.legacyBatteryRecord
    legacyShoesRecord.value = progress.legacyShoesRecord
    legacyBowlRecord.value = progress.legacyBowlRecord
    // A newer chapter can depend on an earlier legacy archive. Never revoke
    // that unlock underneath progress which the player has already made.
    const hasLaterProgress = (key: string) => {
      const index = archiveObjects.findIndex(item => item.key === key)
      return archiveObjects.slice(index + 1).some(item => {
        const later = progress.records[item.key]
        return later && (later.status === 'archived' || later.status === 'investigating' || later.foundClueIds.length > 0)
      })
    }
    records.value = Object.fromEntries(Object.entries(progress.records).map(([key, record]) => {
      // Older generic map investigations used different clues. Restart only that
      // chapter; keep the account, keeper number, list chapter and other records.
      if (key === 'map' && (record.foundClueIds.some((id) => !currentMapClues.has(id))
        || (record.evidenceVerified && !record.completedInteractions?.includes('map-story-saved')))) {
        if (record.status === 'archived' && hasLaterProgress(key)) return [key, normalizeRecord(record)]
        return [key, { ...emptyRecord(), status: 'investigating' }]
      }
      if (key === 'battery' && (record.foundClueIds.some((id) => !currentBatteryClues.has(id))
        || (record.evidenceVerified && !record.completedInteractions?.includes('battery-story-saved')))) {
        legacyBatteryRecord.value = normalizeRecord(record)
        if (record.status === 'archived' && hasLaterProgress(key)) return [key, normalizeRecord(record)]
        return [key, { ...emptyRecord(), status: 'investigating' }]
      }
      if (key === 'shoes' && (record.foundClueIds.some((id) => !currentShoesClues.has(id))
        || (record.evidenceVerified && !record.completedInteractions?.includes('shoes-story-saved')))) {
        legacyShoesRecord.value = normalizeRecord(record)
        // Completed fifth-chapter saves must retain their unlock chain; the old
        // shoe record is backed up, but not invalidated underneath the ending.
        if (hasLaterProgress(key) && record.status === 'archived') return [key, normalizeRecord(record)]
        return [key, { ...emptyRecord(), status: 'investigating' }]
      }
      if (key === 'bowl' && (record.foundClueIds.some((id) => !currentBowlClues.has(id))
        || (record.evidenceVerified && !record.completedInteractions?.includes('bowl-story-saved')))) {
        legacyBowlRecord.value = normalizeRecord(record)
        if (record.status === 'archived') return [key, normalizeRecord(record)]
        return [key, { ...emptyRecord(), status: 'investigating' }]
      }
      return [key, normalizeRecord(record)]
    }))
    selectedObjectKey.value = progress.selectedObjectKey
    keeperNote.value = progress.keeperNote ?? ''
    createdAt.value = progress.createdAt
  }

  return {
    keeperNumber,
    records,
    legacyBatteryRecord,
    legacyShoesRecord,
    legacyBowlRecord,
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
    completeInteraction,
    completeListNarrative,
    completeMapNarrative,
    completeBatteryNarrative,
    completeShoesNarrative,
    completeBowlNarrative,
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
