import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PendingSave } from './pendingSave'
import type * as PendingSaves from './pendingSave'

const storage = new Map<string, string>()
const newPage = async () => { vi.resetModules(); return import('./pendingSave') }
let first: typeof PendingSaves
const pending = (note: string): PendingSave => ({
  username: 'keeper01', baseRevision: 3, updatedAt: 100,
  progress: { keeperNumber: '2026-1234', records: {}, keeperNote: note, createdAt: '2026-10-16' },
})

beforeEach(async () => {
  storage.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value) },
    removeItem: (key: string) => { storage.delete(key) },
    get length() { return storage.size },
    key: (index: number) => [...storage.keys()][index] ?? null,
  })
  vi.stubGlobal('sessionStorage', { getItem: () => 'cloned-tab-id' })
  first = await newPage()
})
afterEach(() => { vi.unstubAllGlobals() })

describe('按页面保留离线存档', () => {
  it('复制标签页也独立写入，确认第一页快照只清除第一页', async () => {
    const second = await newPage()
    const firstDraft = pending('第一页')
    const secondDraft = pending('第二页')
    first.writePendingSave(firstDraft)
    expect(second.readPendingSave('keeper01', true)).toBeNull()
    second.writePendingSave(secondDraft)
    expect(first.readPendingSave('keeper01')).toEqual(firstDraft)
    expect(first.clearPendingSave(firstDraft)).toBe(true)
    expect(first.readPendingSave('keeper01', true)).toBeNull()
    expect(second.readPendingSave('keeper01')).toEqual(secondDraft)
  })

  it('旧请求确认时不会清除同页较新的暂存', () => {
    const acknowledged = pending('已提交')
    const latest = { ...pending('提交后继续调查'), updatedAt: 101 }
    first.writePendingSave(acknowledged)
    first.writePendingSave(latest)
    expect(first.clearPendingSave(acknowledged)).toBe(false)
    expect(first.readPendingSave('keeper01')).toEqual(latest)
    expect(first.clearPendingSave(latest)).toBe(true)
    expect(first.readPendingSave('keeper01')).toBeNull()
  })

  it('恢复v1暂存，确认新快照前保留旧副本，确认后一起清除', () => {
    const legacy = JSON.stringify(pending('旧版本离线进度'))
    storage.set('unclaimed-pending-save-v1:keeper01', legacy)
    const recovered = first.readPendingSave('keeper01')!
    const latest = { ...recovered, progress: { ...recovered.progress, keeperNote: '恢复后继续调查' } }
    first.writePendingSave(latest)
    expect(storage.get('unclaimed-pending-save-v1:keeper01')).toBe(legacy)
    expect(first.clearPendingSave(latest)).toBe(true)
    expect(storage.size).toBe(0)
  })

  it('恢复期间旧客户端另写v1时，确认本页快照仍保留那份新暂存', () => {
    storage.set('unclaimed-pending-save-v1:keeper01', JSON.stringify(pending('原暂存')))
    const recovered = first.readPendingSave('keeper01')!
    first.writePendingSave(recovered)
    const later = JSON.stringify(pending('另一页的新暂存'))
    storage.set('unclaimed-pending-save-v1:keeper01', later)
    first.clearPendingSave(recovered)
    expect(storage.get('unclaimed-pending-save-v1:keeper01')).toBe(later)
    expect(first.readPendingSave('keeper01')?.progress.keeperNote).toBe('另一页的新暂存')
  })

  it('刷新后发现前页草稿并要求核对，确认后清除匹配的源快照', async () => {
    const draft = pending('刷新前的进度')
    first.writePendingSave(draft)
    const restored = await newPage()
    const recovered = restored.readPendingSave('keeper01')!
    expect(recovered.progress).toEqual(draft.progress)
    expect(recovered.baseRevision).toBe(3)
    expect(recovered.conflicted).toBe(true)
    restored.writePendingSave(recovered)
    expect(restored.clearPendingSave(recovered)).toBe(true)
    expect(storage.size).toBe(0)
  })

  it('恢复选择期间源页面继续修改时，保留那份较新的草稿', async () => {
    first.writePendingSave(pending('源页面原进度'))
    const restored = await newPage()
    const recovered = restored.readPendingSave('keeper01')!
    restored.writePendingSave(recovered)
    const newer = { ...pending('源页面继续调查'), updatedAt: 101 }
    first.writePendingSave(newer)
    expect(restored.clearPendingSave(recovered)).toBe(true)
    expect(restored.readPendingSave('keeper01')?.progress.keeperNote).toBe('源页面继续调查')
    expect(first.readPendingSave('keeper01')).toEqual(newer)
  })

  it('连续刷新后确认草稿会清除完整来源链，同时保留源页面的新操作', async () => {
    first.writePendingSave(pending('最初的调查'))
    const second = await newPage()
    const recovered = second.readPendingSave('keeper01')!
    second.writePendingSave({ ...recovered, updatedAt: 101 })
    const third = await newPage()
    const latest = third.readPendingSave('keeper01')!
    third.writePendingSave(latest)
    expect(third.clearPendingSave(latest)).toBe(true)
    expect(third.readPendingSave('keeper01')).toBeNull()

    first.writePendingSave(pending('原调查'))
    const secondDraft = second.readPendingSave('keeper01')!
    second.writePendingSave({ ...secondDraft, updatedAt: 102 })
    const thirdDraft = third.readPendingSave('keeper01')!
    third.writePendingSave(thirdDraft)
    first.writePendingSave({ ...pending('源页继续调查'), updatedAt: 103 })
    third.clearPendingSave(thirdDraft)
    expect(third.readPendingSave('keeper01')?.progress.keeperNote).toBe('源页继续调查')
  })
})
