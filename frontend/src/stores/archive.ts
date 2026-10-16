import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { archiveObjects } from '../data/objects'
import type { EvidenceLevel, ObjectRecord } from '../types/archive'
import { clearProgress, createKeeperNumber, loadProgress, saveProgress } from '../services/progress'

const emptyRecord = (): ObjectRecord => ({
  status: 'available',
  foundClueIds: [],
  classified: {},
})

export const useArchiveStore = defineStore('archive', () => {
  const saved = loadProgress()
  const keeperNumber = ref(saved?.keeperNumber ?? createKeeperNumber())
  const records = ref<Record<string, ObjectRecord>>(saved?.records ?? {})
  const selectedObjectKey = ref<string | undefined>(saved?.selectedObjectKey)
  const createdAt = ref(saved?.createdAt ?? new Date().toISOString())

  const getRecord = (key: string) => records.value[key] ?? emptyRecord()
  const archivedCount = computed(() => archiveObjects.filter((item) => getRecord(item.key).status === 'archived').length)
  const progressPercent = computed(() => Math.round((archivedCount.value / archiveObjects.length) * 100))
  const endingUnlocked = computed(() => archivedCount.value >= 4)

  const ensureRecord = (key: string) => {
    if (!records.value[key]) records.value[key] = emptyRecord()
    return records.value[key]
  }

  const startObject = (key: string) => {
    const record = ensureRecord(key)
    if (record.status !== 'archived') record.status = 'investigating'
  }

  const findClue = (key: string, clueId: string) => {
    const record = ensureRecord(key)
    if (!record.foundClueIds.includes(clueId)) record.foundClueIds.push(clueId)
  }

  const classify = (key: string, conclusionId: string, level: EvidenceLevel) => {
    ensureRecord(key).classified[conclusionId] = level
  }

  const archiveObject = (key: string) => {
    ensureRecord(key).status = 'archived'
  }

  const chooseObject = (key: string) => {
    selectedObjectKey.value = key
  }

  const reset = () => {
    clearProgress()
    keeperNumber.value = createKeeperNumber()
    records.value = {}
    selectedObjectKey.value = undefined
    createdAt.value = new Date().toISOString()
  }

  watch(
    [keeperNumber, records, selectedObjectKey, createdAt],
    () => saveProgress({ keeperNumber: keeperNumber.value, records: records.value, selectedObjectKey: selectedObjectKey.value, createdAt: createdAt.value }),
    { deep: true },
  )

  return {
    keeperNumber,
    records,
    selectedObjectKey,
    archivedCount,
    progressPercent,
    endingUnlocked,
    getRecord,
    startObject,
    findClue,
    classify,
    archiveObject,
    chooseObject,
    reset,
  }
})
