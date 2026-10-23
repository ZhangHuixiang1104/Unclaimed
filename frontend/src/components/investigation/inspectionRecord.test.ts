import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useArchiveStore } from '../../stores/archive'
import { archiveObjects } from '../../data/objects'
import { inspectionRecord } from './inspectionRecord'

describe('旧档回看与进行中调查', () => {
  it('已归档旧记录能查看新版物件全部线索，原始存档不会被修改', () => {
    setActivePinia(createPinia())
    const archive = useArchiveStore()
    for (const item of archiveObjects) {
      const original = { ...archive.getRecord(item.key), status: 'archived' as const, foundClueIds: ['legacy-clue'] }
      const before = JSON.stringify(original)
      const display = inspectionRecord(item, original)
      expect(display.foundClueIds).toEqual(item.clues.map(clue => clue.id))
      expect(display.completedInteractions.length).toBeGreaterThan(0)
      expect(JSON.stringify(original)).toBe(before)
    }
  })
  it('进行中的调查不会因为回看适配而补齐线索或跳过动作', () => {
    setActivePinia(createPinia())
    const archive = useArchiveStore()
    for (const item of archiveObjects) {
      const original = { ...archive.getRecord(item.key), status: 'investigating' as const }
      expect(inspectionRecord(item, original)).toBe(original)
      expect(original.foundClueIds).toEqual([])
      expect(original.completedInteractions).toEqual([])
    }
  })
})
