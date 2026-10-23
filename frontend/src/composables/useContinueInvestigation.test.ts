import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useArchiveStore } from '../stores/archive'
import { archiveObjects } from '../data/objects'
import { useContinueInvestigation } from './useContinueInvestigation'

beforeEach(() => setActivePinia(createPinia()))
describe('继续调查入口', () => {
  it('新玩家进入第一件物品，已开始的调查继续保留在检查台', () => {
    const archive = useArchiveStore()
    const next = useContinueInvestigation()
    expect(next.to.value).toBe('/object/list')
    expect(next.label.value).toBe('开始调查')
    archive.startObject('list')
    expect(next.label.value).toBe('继续调查')
    archive.records.list!.evidenceVerified = true
    expect(next.to.value).toBe('/object/list')
    archive.revealHistory('list')
    expect(next.to.value).toBe('/history/list')
    expect(next.label.value).toBe('继续阅读史实')
  })
  it('完成前章后接续当前未完成章节，五章完成后进入终章', () => {
    const archive = useArchiveStore()
    const next = useContinueInvestigation()
    for (const item of archiveObjects) {
      expect(next.item.value.key).toBe(item.key)
      archive.records[item.key] = { ...archive.getRecord(item.key), status: 'archived' }
    }
    expect(next.to.value).toBe('/ending')
    expect(next.label.value).toBe('进入终章')
  })
})
