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

describe('五件独立故事的顺序调查与章节解锁', () => {
  it('名单拼合与清泥按顺序记录，重新载入后仍保留', () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    archive.completeInteraction('list', 'list-mud-cleared')
    expect(archive.getRecord('list').completedInteractions).toEqual([])
    archive.completeInteraction('list', 'list-pieces-assembled')
    archive.completeInteraction('list', 'list-mud-cleared')
    archive.completeInteraction('list', 'list-mud-cleared')
    expect(archive.getRecord('list').completedInteractions).toEqual(['list-pieces-assembled', 'list-mud-cleared'])
    const saved = archive.exportProgress()

    setActivePinia(createPinia())
    const restored = useArchiveStore()
    restored.replaceProgress(saved)
    expect(restored.getRecord('list').completedInteractions).toEqual(['list-pieces-assembled', 'list-mud-cleared'])
  })

  it('名单线索必须完成拼合清泥，并按正面至背面的顺序登记', () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    archive.findClue('list', 'list-task')
    expect(archive.getRecord('list').foundClueIds).toEqual([])
    archive.completeInteraction('list', 'list-pieces-assembled')
    archive.completeInteraction('list', 'list-mud-cleared')
    archive.findClue('list', 'list-key')
    expect(archive.getRecord('list').foundClueIds).toEqual([])
    for (const clueId of ['list-task', 'list-key', 'list-stub']) archive.findClue('list', clueId)
    expect(archive.getRecord('list').foundClueIds).toEqual(['list-task', 'list-key', 'list-stub'])
  })

  it('名单三幕读完才能保存故事，保存后才允许揭露史实', () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    expect(archive.completeListNarrative()).toBe(false)
    archive.revealHistory('list')
    expect(archive.getRecord('list').historyRevealed).toBe(false)

    archive.completeInteraction('list', 'list-pieces-assembled')
    archive.completeInteraction('list', 'list-mud-cleared')
    archive.findClue('list', 'list-task')
    archive.findClue('list', 'list-key')
    expect(archive.completeListNarrative()).toBe(false)
    archive.findClue('list', 'list-stub')
    expect(archive.completeListNarrative()).toBe(true)
    expect(archive.getRecord('list').completedInteractions).toContain('list-story-saved')
    expect(archive.getRecord('list').evidenceVerified).toBe(true)
    archive.revealHistory('list')
    expect(archive.getRecord('list').historyRevealed).toBe(true)
    archive.archiveObject('list')
    expect(archive.getRecord('list').status).toBe('investigating')

    const saved = archive.exportProgress()
    setActivePinia(createPinia())
    const restored = useArchiveStore()
    restored.replaceProgress(saved)
    expect(restored.getRecord('list').historyRevealed).toBe(true)
    expect(restored.getRecord('list').historyRead).toBe(false)
    restored.markHistoryRead('list')
    expect(restored.getRecord('list').historyRead).toBe(false)
    for (const index of [1, 2, 3, 4]) restored.completeInteraction('list', `list-history-0${index}`)
    restored.markHistoryRead('list')
    restored.archiveObject('list')
    expect(restored.getRecord('list').status).toBe('archived')
    expect(restored.isObjectUnlocked('map')).toBe(true)
  })

  it('行军图四段故事、背注、展签和四站史实逐步解锁，并可恢复存档', () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    archive.completeInteraction('list', 'list-pieces-assembled')
    archive.completeInteraction('list', 'list-mud-cleared')
    for (const id of ['list-task', 'list-key', 'list-stub']) archive.findClue('list', id)
    archive.completeListNarrative()
    archive.revealHistory('list')
    for (const index of [1, 2, 3, 4]) archive.completeInteraction('list', `list-history-0${index}`)
    archive.markHistoryRead('list')
    archive.archiveObject('list')
    expect(archive.startObject('map')).toBe(true)
    archive.findClue('map', 'not-on-map')
    expect(archive.getRecord('map').foundClueIds).toEqual([])
    for (const clue of archiveObjects[1].clues) archive.findClue('map', clue.id)
    expect(archive.completeMapNarrative()).toBe(false)
    archive.completeInteraction('map', 'map-back-viewed')
    archive.completeInteraction('map', 'map-caption-supported')
    expect(archive.completeMapNarrative()).toBe(true)
    archive.revealHistory('map')
    archive.markHistoryRead('map')
    expect(archive.getRecord('map').historyRead).toBe(false)
    const saved = archive.exportProgress()
    setActivePinia(createPinia())
    const restored = useArchiveStore()
    restored.replaceProgress(saved)
    expect(restored.getRecord('map').foundClueIds).toHaveLength(4)
    expect(restored.getRecord('map').evidenceVerified).toBe(true)
    for (const index of [1, 2, 3, 4]) restored.completeInteraction('map', `map-history-0${index}`)
    restored.markHistoryRead('map')
    restored.archiveObject('map')
    expect(restored.getRecord('map').status).toBe('archived')
    expect(restored.isObjectUnlocked('battery')).toBe(true)
  })

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

      if (item.key === 'list') {
        archive.completeInteraction('list', 'list-pieces-assembled')
        archive.completeInteraction('list', 'list-mud-cleared')
      }

      item.clues.forEach((clue) => archive.findClue(item.key, clue.id, clue.position))
      if (item.key === 'map') {
        expect(archive.completeMapNarrative()).toBe(false)
        archive.completeInteraction('map', 'map-back-viewed')
        archive.completeInteraction('map', 'map-caption-supported')
        expect(archive.completeMapNarrative()).toBe(true)
      } else {
      item.conclusions.forEach((conclusion) => archive.reviewClaim(item.key, conclusion.id, true))
      archive.reviewClaim(item.key, item.screeningDecoys[0].id, true)
      archive.reviewClaim(item.key, item.screeningDecoys[1].id, false)
      expect(archive.verifyScreening(item.key)).toBe(false)
      archive.reviewClaim(item.key, item.screeningDecoys[0].id, false)
      expect(archive.verifyScreening(item.key)).toBe(true)

      item.conclusions.forEach((conclusion) => archive.classify(item.key, conclusion.id, conclusion.expectedLevel))
      archive.verifyEvidence(item.key, true)
      }
      expect(archive.getRecord(item.key).evidenceVerified).toBe(true)
      archive.archiveObject(item.key)
      expect(archive.getRecord(item.key).status).toBe('investigating')

      archive.revealHistory(item.key)
      if (item.key === 'list' || item.key === 'map') for (const index of [1, 2, 3, 4]) archive.completeInteraction(item.key, `${item.key}-history-0${index}`)
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
    archive.completeInteraction('list', 'list-pieces-assembled')
    archive.completeInteraction('list', 'list-mud-cleared')
    item.clues.forEach((clue) => archive.findClue(item.key, clue.id))
    item.conclusions.forEach((conclusion) => archive.reviewClaim(item.key, conclusion.id, true))
    item.screeningDecoys.forEach((decoy) => archive.reviewClaim(item.key, decoy.id, false))
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
    for (const index of [1, 2, 3, 4]) archive.completeInteraction('list', `list-history-0${index}`)
    archive.markHistoryRead(item.key)
    archive.archiveObject(item.key)
    archive.reviewClaim(item.key, item.conclusions[0].id, false)
    archive.classify(item.key, item.conclusions[0].id, 'unknown')
    expect(archive.getRecord(item.key).status).toBe('archived')
    expect(archive.getRecord(item.key).classified[item.conclusions[0].id]).toBe(item.conclusions[0].expectedLevel)
    expect(archive.exportProgress().contentVersion).toBe('independent-chapters-v3')
  })
})
