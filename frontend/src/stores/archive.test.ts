import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from './archive'
import type { ObjectRecord } from '../types/archive'

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
  it('恢复有后续进度的旧档时保留前置归档，不将终章或当前章节重新锁住', () => {
    const archive = useArchiveStore()
    const legacy: Record<string, ObjectRecord> = Object.fromEntries(archiveObjects.map(item => [item.key, {
      ...archive.getRecord(item.key), status: 'archived' as const,
      foundClueIds: [`${item.key}-old-clue`], evidenceVerified: true, historyRevealed: true, historyRead: true,
    }]))
    archive.replaceProgress({ ...archive.exportProgress(), records: legacy })
    expect(archive.archivedCount).toBe(5)
    expect(archive.endingUnlocked).toBe(true)
    const saved = archive.exportProgress()
    archive.replaceProgress(saved)
    expect(archive.endingUnlocked).toBe(true)
    for (const item of archiveObjects) expect(archive.isObjectUnlocked(item.key)).toBe(true)

    legacy.bowl = { ...archive.getRecord('bowl'), status: 'investigating', foundClueIds: ['bowl-unwrapped'], completedInteractions: ['bowl-wrapper-opened'], evidenceVerified: false, historyRevealed: false, historyRead: false }
    archive.replaceProgress({ ...archive.exportProgress(), records: legacy })
    expect(archive.isObjectUnlocked('bowl')).toBe(true)
    expect(archive.getRecord('bowl').foundClueIds).toEqual(['bowl-unwrapped'])
  })
  it('饭碗四段必须由动作发现，史实可以乱序阅读但四站读齐才能建档', () => {
    const archive = useArchiveStore()
    archive.replaceProgress({ ...archive.exportProgress(), records: Object.fromEntries(['list', 'map', 'battery', 'shoes'].map((key) => [key, { ...archive.getRecord(key), status: 'archived' }])) })
    archive.startObject('bowl')
    archive.findClue('bowl', 'bowl-marks')
    archive.completeInteraction('bowl', 'bowl-paper-turned')
    expect(archive.getRecord('bowl').foundClueIds).toEqual([])
    archive.completeInteraction('bowl', 'bowl-wrapper-opened')
    archive.findClue('bowl', 'bowl-unwrapped')
    archive.completeInteraction('bowl', 'bowl-rotated')
    archive.completeInteraction('bowl', 'bowl-light-on')
    archive.findClue('bowl', 'bowl-rim')
    archive.completeInteraction('bowl', 'bowl-base-viewed')
    archive.findClue('bowl', 'bowl-marks')
    archive.completeInteraction('bowl', 'bowl-paper-turned')
    archive.findClue('bowl', 'bowl-paper')
    expect(archive.completeBowlNarrative(1)).toBe(false)
    expect(archive.completeBowlNarrative(0)).toBe(true)
    archive.revealHistory('bowl')
    archive.completeInteraction('bowl', 'bowl-history-04')
    expect(archive.getRecord('bowl').completedInteractions).toContain('bowl-history-04')
    archive.markHistoryRead('bowl')
    archive.archiveObject('bowl')
    expect(archive.endingUnlocked).toBe(false)
    for (const index of [2, 1, 3]) archive.completeInteraction('bowl', `bowl-history-0${index}`)
    archive.markHistoryRead('bowl')
    archive.archiveObject('bowl')
    expect(archive.endingUnlocked).toBe(true)
  })

  it('旧饭碗进度保留备份；已归档记录不取消终章资格', () => {
    const archive = useArchiveStore()
    const oldBowl = { ...archive.getRecord('bowl'), status: 'investigating' as const,
      foundClueIds: ['bowl-note'], evidenceVerified: true }
    archive.replaceProgress({ ...archive.exportProgress(), contentVersion: 'independent-chapters-v5', records: { bowl: oldBowl } })
    expect(archive.getRecord('bowl').foundClueIds).toEqual([])
    expect(archive.exportProgress().legacyBowlRecord?.foundClueIds).toEqual(['bowl-note'])
    archive.replaceProgress({ ...archive.exportProgress(), records: Object.fromEntries([
      ...['list', 'map', 'battery', 'shoes'].map((key) => [key, { ...archive.getRecord(key), status: 'archived' }]),
      ['bowl', { ...oldBowl, status: 'archived' }],
    ]) })
    expect(archive.endingUnlocked).toBe(true)
  })
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

  it('未揭露史实不能预记阅读站点，普通物件也不能登记虚构线索编号', () => {
    const archive = useArchiveStore()
    archive.completeInteraction('list', 'list-history-01')
    expect(archive.getRecord('list').completedInteractions).toEqual([])
    archive.replaceProgress({ ...archive.exportProgress(), records: {
      list: { ...archive.getRecord('list'), status: 'archived' },
      map: { ...archive.getRecord('map'), status: 'archived' },
      battery: { ...archive.getRecord('battery'), status: 'archived' },
    } })
    archive.startObject('shoes')
    archive.findClue('shoes', 'made-up-clue')
    expect(archive.getRecord('shoes').foundClueIds).toEqual([])
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

  it('电池盒须逐层查看、找齐四段故事并选对展签，四站史实读完后才归档', () => {
    const archive = useArchiveStore()
    archive.replaceProgress({ ...archive.exportProgress(), records: {
      list: { ...archive.getRecord('list'), status: 'archived' },
      map: { ...archive.getRecord('map'), status: 'archived' },
    } })
    archive.startObject('battery')
    archive.findClue('battery', 'battery-old-band')
    expect(archive.getRecord('battery').foundClueIds).toEqual([])
    archive.completeInteraction('battery', 'battery-band-lifted')
    archive.findClue('battery', 'battery-old-band')
    archive.completeInteraction('battery', 'battery-right-viewed')
    archive.findClue('battery', 'battery-terminal')
    archive.completeInteraction('battery', 'battery-lid-opened')
    archive.findClue('battery', 'battery-blank')
    expect(archive.getRecord('battery').foundClueIds).toHaveLength(2)
    archive.findClue('battery', 'battery-note')
    archive.findClue('battery', 'battery-blank')
    expect(archive.completeBatteryNarrative(1)).toBe(false)
    expect(archive.completeBatteryNarrative(0)).toBe(true)
    archive.revealHistory('battery')
    archive.markHistoryRead('battery')
    expect(archive.getRecord('battery').historyRead).toBe(false)
    const saved = archive.exportProgress()
    setActivePinia(createPinia())
    const restored = useArchiveStore()
    restored.replaceProgress(saved)
    expect(restored.getRecord('battery').foundClueIds).toHaveLength(4)
    expect(restored.getRecord('battery').historyRevealed).toBe(true)
    for (const index of [1, 2, 3, 4]) restored.completeInteraction('battery', `battery-history-0${index}`)
    restored.markHistoryRead('battery')
    restored.archiveObject('battery')
    expect(restored.getRecord('battery').status).toBe('archived')
    expect(restored.isObjectUnlocked('shoes')).toBe(true)
  })

  it('旧电池盒进度单章迁移，旧记录留在备份字段，前两章不受影响', () => {
    const archive = useArchiveStore()
    const oldBattery = { ...archive.getRecord('battery'), status: 'archived' as const,
      foundClueIds: ['battery-cut'], evidenceVerified: true, historyRevealed: true, historyRead: true }
    archive.replaceProgress({ ...archive.exportProgress(), contentVersion: 'independent-chapters-v3', records: {
      list: { ...archive.getRecord('list'), status: 'archived' },
      map: { ...archive.getRecord('map'), status: 'archived' },
      battery: oldBattery,
    } })
    expect(archive.getRecord('list').status).toBe('archived')
    expect(archive.getRecord('map').status).toBe('archived')
    expect(archive.getRecord('battery').status).toBe('investigating')
    expect(archive.legacyBatteryRecord?.foundClueIds).toEqual(['battery-cut'])
    expect(archive.exportProgress().legacyBatteryRecord?.status).toBe('archived')
  })

  it('草鞋要通过比较、补编、鞋底与外绳读完四段，史实四站后才归档', () => {
    const archive = useArchiveStore()
    archive.replaceProgress({ ...archive.exportProgress(), records: {
      list: { ...archive.getRecord('list'), status: 'archived' },
      map: { ...archive.getRecord('map'), status: 'archived' },
      battery: { ...archive.getRecord('battery'), status: 'archived' },
    } })
    archive.startObject('shoes')
    archive.findClue('shoes', 'shoes-measure')
    expect(archive.getRecord('shoes').foundClueIds).toEqual([])
    archive.completeInteraction('shoes', 'shoes-separated')
    archive.completeInteraction('shoes', 'shoes-measured')
    archive.findClue('shoes', 'shoes-measure')
    archive.completeInteraction('shoes', 'shoes-light-on')
    archive.completeInteraction('shoes', 'shoes-large-repair-viewed')
    archive.findClue('shoes', 'shoes-repair')
    expect(archive.getRecord('shoes').foundClueIds).toEqual(['shoes-measure'])
    archive.completeInteraction('shoes', 'shoes-small-repair-viewed')
    archive.findClue('shoes', 'shoes-repair')
    archive.completeInteraction('shoes', 'shoes-large-sole-viewed')
    archive.completeInteraction('shoes', 'shoes-small-sole-viewed')
    archive.completeInteraction('shoes', 'shoes-wear-traced')
    archive.findClue('shoes', 'shoes-wear')
    archive.completeInteraction('shoes', 'shoes-cord-lifted')
    archive.findClue('shoes', 'shoes-cord')
    expect(archive.completeShoesNarrative(1)).toBe(false)
    expect(archive.completeShoesNarrative(0)).toBe(true)
    archive.revealHistory('shoes')
    archive.completeInteraction('shoes', 'shoes-history-04')
    expect(archive.getRecord('shoes').completedInteractions).toContain('shoes-history-04')
    archive.markHistoryRead('shoes')
    expect(archive.getRecord('shoes').historyRead).toBe(false)
    const saved = archive.exportProgress()
    setActivePinia(createPinia())
    const restored = useArchiveStore()
    restored.replaceProgress(saved)
    expect(restored.getRecord('shoes').foundClueIds).toHaveLength(4)
    expect(restored.getRecord('shoes').completedInteractions).toContain('shoes-story-saved')
    for (const index of [2, 1, 3]) restored.completeInteraction('shoes', `shoes-history-0${index}`)
    restored.markHistoryRead('shoes')
    restored.archiveObject('shoes')
    expect(restored.getRecord('shoes').status).toBe('archived')
    expect(restored.isObjectUnlocked('bowl')).toBe(true)
  })

  it('v4 通用草鞋旧档留备份，仅草鞋单章重新调查', () => {
    const archive = useArchiveStore()
    const oldShoes = { ...archive.getRecord('shoes'), status: 'archived' as const,
      foundClueIds: ['shoes-patch'], evidenceVerified: true, historyRevealed: true, historyRead: true }
    archive.replaceProgress({ ...archive.exportProgress(), contentVersion: 'independent-chapters-v4', records: {
      list: { ...archive.getRecord('list'), status: 'archived' },
      map: { ...archive.getRecord('map'), status: 'archived' },
      battery: { ...archive.getRecord('battery'), status: 'archived' },
      shoes: oldShoes,
    } })
    expect(archive.getRecord('shoes').status).toBe('investigating')
    expect(archive.getRecord('battery').status).toBe('archived')
    expect(archive.exportProgress().legacyShoesRecord?.foundClueIds).toEqual(['shoes-patch'])
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

      if (item.key === 'battery') {
        archive.completeInteraction('battery', 'battery-band-lifted')
        archive.completeInteraction('battery', 'battery-right-viewed')
        archive.completeInteraction('battery', 'battery-lid-opened')
      }
      if (item.key === 'shoes') {
        archive.completeInteraction('shoes', 'shoes-separated')
        archive.completeInteraction('shoes', 'shoes-measured')
        archive.completeInteraction('shoes', 'shoes-light-on')
        archive.completeInteraction('shoes', 'shoes-large-repair-viewed')
        archive.completeInteraction('shoes', 'shoes-small-repair-viewed')
        archive.completeInteraction('shoes', 'shoes-large-sole-viewed')
        archive.completeInteraction('shoes', 'shoes-small-sole-viewed')
        archive.completeInteraction('shoes', 'shoes-wear-traced')
      }
      if (item.key === 'bowl') {
        archive.completeInteraction('bowl', 'bowl-wrapper-opened')
        archive.findClue('bowl', 'bowl-unwrapped')
        archive.completeInteraction('bowl', 'bowl-rotated')
        archive.completeInteraction('bowl', 'bowl-light-on')
        archive.findClue('bowl', 'bowl-rim')
        archive.completeInteraction('bowl', 'bowl-base-viewed')
        archive.findClue('bowl', 'bowl-marks')
        archive.completeInteraction('bowl', 'bowl-paper-turned')
      }
      item.clues.forEach((clue) => archive.findClue(item.key, clue.id, clue.position))
      if (item.key === 'shoes') {
        archive.completeInteraction('shoes', 'shoes-cord-lifted')
        archive.findClue('shoes', 'shoes-cord')
      }
      if (item.key === 'map') {
        expect(archive.completeMapNarrative()).toBe(false)
        archive.completeInteraction('map', 'map-back-viewed')
        archive.completeInteraction('map', 'map-caption-supported')
        expect(archive.completeMapNarrative()).toBe(true)
      } else if (item.key === 'battery') {
        expect(archive.completeBatteryNarrative(1)).toBe(false)
        expect(archive.completeBatteryNarrative(0)).toBe(true)
      } else if (item.key === 'shoes') {
        expect(archive.completeShoesNarrative(1)).toBe(false)
        expect(archive.completeShoesNarrative(0)).toBe(true)
      } else if (item.key === 'bowl') {
        expect(archive.completeBowlNarrative(2)).toBe(false)
        expect(archive.completeBowlNarrative(0)).toBe(true)
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
      if (['list', 'map', 'battery', 'shoes', 'bowl'].includes(item.key)) for (const index of [1, 2, 3, 4]) archive.completeInteraction(item.key, `${item.key}-history-0${index}`)
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
    expect(archive.exportProgress().contentVersion).toBe('independent-chapters-v6')
  })
})
