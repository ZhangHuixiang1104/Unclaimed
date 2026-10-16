import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from './archive'

const storage = new Map<string, string>()

beforeEach(() => {
  storage.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value) },
    removeItem: (key: string) => { storage.delete(key) },
  })
  setActivePinia(createPinia())
})

describe('物件调查与路线解锁', () => {
  it('需要完成五件物品的调查、筛选、核验和史实阅读才能进入终章', () => {
    const archive = useArchiveStore()
    expect(archive.getObjectStatus('list')).toBe('available')
    expect(archive.getObjectStatus('map')).toBe('locked')
    expect(archive.startObject('map')).toBe(false)
    expect(archive.endingUnlocked).toBe(false)

    for (const item of archiveObjects) {
      expect(archive.isObjectUnlocked(item.key)).toBe(true)
      expect(archive.startObject(item.key)).toBe(true)
      expect(archive.getObjectStatus(item.key)).toBe('investigating')

      item.clues.forEach((clue) => archive.findClue(item.key, clue.id, clue.position))
      item.conclusions.forEach((conclusion) => archive.reviewClaim(item.key, conclusion.id, true))
      archive.reviewClaim(item.key, 'decoy-same-time', true)
      archive.reviewClaim(item.key, 'decoy-owner', false)
      expect(archive.verifyScreening(item.key)).toBe(false)
      archive.reviewClaim(item.key, 'decoy-same-time', false)
      expect(archive.verifyScreening(item.key)).toBe(true)

      item.conclusions.forEach((conclusion) => archive.classify(item.key, conclusion.id, conclusion.expectedLevel))
      archive.verifyEvidence(item.key, true)
      expect(archive.getRecord(item.key).evidenceVerified).toBe(true)
      archive.archiveObject(item.key)
      expect(archive.getRecord(item.key).status).toBe('investigating')

      archive.revealHistory(item.key)
      archive.markHistoryRead(item.key)
      archive.archiveObject(item.key)
      expect(archive.getObjectStatus(item.key)).toBe('archived')
    }

    expect(archive.archivedCount).toBe(5)
    expect(archive.progressPercent).toBe(100)
    expect(archive.endingUnlocked).toBe(true)
  })

  it('修改筛选结果会撤销核验，已归档记录保持只读', () => {
    const archive = useArchiveStore()
    const item = archiveObjects[0]
    archive.startObject(item.key)
    item.clues.forEach((clue) => archive.findClue(item.key, clue.id))
    item.conclusions.forEach((conclusion) => archive.reviewClaim(item.key, conclusion.id, true))
    archive.reviewClaim(item.key, 'decoy-same-time', false)
    archive.reviewClaim(item.key, 'decoy-owner', false)
    expect(archive.verifyScreening(item.key)).toBe(true)
    item.conclusions.forEach((conclusion) => archive.classify(item.key, conclusion.id, conclusion.expectedLevel))
    archive.verifyEvidence(item.key, true)
    expect(archive.getRecord(item.key).evidenceVerified).toBe(true)

    archive.reviewClaim(item.key, item.conclusions[0].id, false)
    expect(archive.getRecord(item.key).screeningVerified).toBe(false)
    expect(archive.getRecord(item.key).evidenceVerified).toBe(false)
    expect(archive.getRecord(item.key).classified).toEqual({})
    archive.verifyEvidence(item.key, true)
    expect(archive.getRecord(item.key).evidenceVerified).toBe(false)

    archive.reviewClaim(item.key, item.conclusions[0].id, true)
    archive.verifyScreening(item.key)
    item.conclusions.forEach((conclusion) => archive.classify(item.key, conclusion.id, conclusion.expectedLevel))
    archive.verifyEvidence(item.key, true)
    archive.revealHistory(item.key)
    archive.markHistoryRead(item.key)
    archive.archiveObject(item.key)
    archive.reviewClaim(item.key, item.conclusions[0].id, false)
    archive.classify(item.key, item.conclusions[0].id, 'unknown')
    expect(archive.getRecord(item.key).status).toBe('archived')
    expect(archive.getRecord(item.key).classified[item.conclusions[0].id]).toBe(item.conclusions[0].expectedLevel)
  })
})
