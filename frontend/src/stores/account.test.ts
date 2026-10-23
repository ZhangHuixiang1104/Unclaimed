import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAccountStore } from './account'
import { useArchiveStore } from './archive'
import type { SavedProgress } from '../services/progress'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
})
const health = () => json({ status: 'ok', saveContract: 'independent-chapters-v6' })

beforeEach(() => { setActivePinia(createPinia()) })
afterEach(() => { vi.unstubAllGlobals() })

describe('账号与云端进度', () => {
  it('退出后登录另一账号只恢复其独立档案，重新登录原账号仍保留原进度', async () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    archive.records.list!.foundClueIds = ['list-task']
    const firstSave = { ...archive.exportProgress(), keeperNumber: '2026-1111' }
    const secondSave = { ...archive.exportProgress(), keeperNumber: '2026-2222', records: {} }
    archive.reset()
    let activeUser = ''
    const writes: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/login')) {
        activeUser = JSON.parse(String(init?.body)).username
        return json({ username: activeUser })
      }
      if (input.endsWith('/auth/logout')) return json({ ok: true })
      if (init?.method === 'PUT') writes.push(activeUser)
      return json({ progress: activeUser === 'keeper01' ? firstSave : secondSave, revision: 1, updatedAt: 100 })
    }))
    const account = useAccountStore()
    expect(await account.authenticate('login', 'keeper01', 'long-password')).toBe(true)
    expect(archive.getRecord('list').foundClueIds).toEqual(['list-task'])
    await account.logout()
    expect(account.signedIn).toBe(false)
    expect(Object.keys(archive.records)).toHaveLength(0)
    expect(await account.authenticate('login', 'keeper02', 'long-password')).toBe(true)
    expect(archive.keeperNumber).toBe('2026-2222')
    expect(Object.keys(archive.records)).toHaveLength(0)
    await account.logout()
    expect(await account.authenticate('login', 'keeper01', 'long-password')).toBe(true)
    expect(archive.keeperNumber).toBe('2026-1111')
    expect(archive.getRecord('list').foundClueIds).toEqual(['list-task'])
    expect(writes).toHaveLength(0)
  })

  it('旧后端进程未更新时直接提示版本不一致，不尝试写入', async () => {
    const requests: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      requests.push(input)
      return json({ status: 'ok' })
    }))
    const account = useAccountStore()
    expect(await account.authenticate('login', 'keeper01', 'long-password')).toBe(false)
    expect(account.error).toContain('版本与当前页面不一致')
    expect(requests).toEqual(['/api/v1/health'])
  })

  it('注册后把当前页面进度上传到新账号', async () => {
    const requests: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      requests.push(`${init?.method ?? 'GET'} ${input}`)
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/register')) return json({ username: 'keeper01' }, 201)
      if (input.endsWith('/save') && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { progress: SavedProgress }
        expect(body.progress.records.list.status).toBe('investigating')
        return json({ progress: body.progress, revision: 1, updatedAt: 100 })
      }
      return json({ progress: null, revision: 0, updatedAt: null })
    }))
    const archive = useArchiveStore()
    archive.startObject('list')
    const account = useAccountStore()
    expect(await account.authenticate('register', 'keeper01', 'long-password')).toBe(true)
    expect(account.username).toBe('keeper01')
    expect(account.revision).toBe(1)
    expect(account.cloudReady).toBe(true)
    expect(account.syncState).toBe('synced')
    expect(requests).toEqual(['GET /api/v1/health', 'POST /api/v1/auth/register', 'GET /api/v1/save', 'PUT /api/v1/save'])
  })

  it('打开页面时读取已有云端存档，当前页面进度冲突时等待玩家选择', async () => {
    const remote: SavedProgress = {
      keeperNumber: '2026-1234', records: {}, createdAt: '2026-10-16T00:00:00.000Z',
    }
    vi.stubGlobal('fetch', vi.fn(async (input: string) => input.endsWith('/health') ? health()
      : input.endsWith('/auth/me') || input.endsWith('/auth/login') ? json({ username: 'keeper01' })
        : json({ progress: remote, revision: 4, updatedAt: 200 })))
    const account = useAccountStore()
    await account.initialize()
    expect(account.ready).toBe(true)
    expect(useArchiveStore().keeperNumber).toBe('2026-1234')
    expect(account.revision).toBe(4)

    setActivePinia(createPinia())
    const archive = useArchiveStore()
    archive.startObject('list')
    const secondAccount = useAccountStore()
    expect(await secondAccount.authenticate('login', 'keeper01', 'long-password')).toBe(true)
    expect(secondAccount.syncState).toBe('conflict')
    await secondAccount.chooseCloud()
    expect(secondAccount.syncState).toBe('saving')
    expect(archive.keeperNumber).toBe('2026-1234')
    expect(Object.keys(archive.records)).toHaveLength(0)
  })

  it('云端把可选字段返回为 null 时，不把同一份存档误判为冲突', async () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    const remote = { ...archive.exportProgress(), selectedObjectKey: null }
    vi.stubGlobal('fetch', vi.fn(async (input: string) => input.endsWith('/health') ? health()
      : input.endsWith('/auth/login') ? json({ username: 'keeper01' })
        : json({ progress: remote, revision: 3, updatedAt: 200 })))
    const account = useAccountStore()
    expect(await account.authenticate('login', 'keeper01', 'long-password')).toBe(true)
    expect(account.syncState).toBe('synced')
    expect(account.revision).toBe(3)
  })

  it('旧版云存档不会被当成新版通关，也不会自动覆盖', async () => {
    const legacy: SavedProgress = {
      keeperNumber: '2026-7777',
      records: {
        list: {
          status: 'archived', foundClueIds: ['list-fold'], completedInteractions: [], classified: {}, markerPositions: {},
          acceptedConclusionIds: [], rejectedClaimIds: [], screeningVerified: true,
          evidenceVerified: true, historyRevealed: true, historyRead: true,
        },
      },
      createdAt: '2026-10-16T00:00:00.000Z',
    }
    const uploads: SavedProgress[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/me')) return json({ username: 'keeper01' })
      if (input.endsWith('/save') && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { progress: SavedProgress }
        uploads.push(body.progress)
        return json({ progress: body.progress, revision: 5, updatedAt: 201 })
      }
      return json({ progress: legacy, revision: 4, updatedAt: 200 })
    }))
    const account = useAccountStore()
    const archive = useArchiveStore()
    await account.initialize()
    expect(account.syncState).toBe('upgrade')
    expect(uploads).toHaveLength(0)
    expect(archive.archivedCount).toBe(0)
    expect(account.cloudProgress?.records.list.status).toBe('archived')

    expect(await account.startNewEdition()).toBe(true)
    expect(uploads).toHaveLength(1)
    expect(uploads[0].contentVersion).toBe('independent-chapters-v6')
    expect(uploads[0].records).toEqual({})
    expect(account.syncState).toBe('synced')
  })

  it('v3云存档只重开电池盒章节，保留旧记录并自动上传v5', async () => {
    vi.useFakeTimers()
    try {
      const oldBattery = { ...useArchiveStore().getRecord('battery'), status: 'archived' as const,
        foundClueIds: ['battery-cut'], evidenceVerified: true, historyRevealed: true, historyRead: true }
      const remote: SavedProgress = { ...useArchiveStore().exportProgress(), contentVersion: 'independent-chapters-v3',
        records: { list: { ...useArchiveStore().getRecord('list'), status: 'archived' },
          map: { ...useArchiveStore().getRecord('map'), status: 'archived' }, battery: oldBattery } }
      const uploads: SavedProgress[] = []
      vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
        if (input.endsWith('/health')) return health()
        if (input.endsWith('/auth/me')) return json({ username: 'keeper01' })
        if (input.endsWith('/save') && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { progress: SavedProgress }
          uploads.push(body.progress)
          return json({ progress: body.progress, revision: 2, updatedAt: 201 })
        }
        return json({ progress: remote, revision: 1, updatedAt: 200 })
      }))
      const account = useAccountStore()
      await account.initialize()
      await vi.advanceTimersByTimeAsync(750)
      const archive = useArchiveStore()
      expect(account.syncState).toBe('synced')
      expect(archive.getRecord('list').status).toBe('archived')
      expect(archive.getRecord('map').status).toBe('archived')
      expect(archive.getRecord('battery').status).toBe('investigating')
      expect(uploads).toHaveLength(1)
      expect(uploads[0].contentVersion).toBe('independent-chapters-v6')
      expect(uploads[0].legacyBatteryRecord?.foundClueIds).toEqual(['battery-cut'])
    } finally {
      vi.useRealTimers()
    }
  })

  it('v4云存档仅迁移草鞋占位章节，旧记录随v5上传保留', async () => {
    vi.useFakeTimers()
    try {
      const archive = useArchiveStore()
      const oldShoes = { ...archive.getRecord('shoes'), status: 'archived' as const,
        foundClueIds: ['shoes-patch'], evidenceVerified: true, historyRevealed: true, historyRead: true }
      const remote: SavedProgress = { ...archive.exportProgress(), contentVersion: 'independent-chapters-v4', records: {
        list: { ...archive.getRecord('list'), status: 'archived' },
        map: { ...archive.getRecord('map'), status: 'archived' },
        battery: { ...archive.getRecord('battery'), status: 'archived' },
        shoes: oldShoes,
      } }
      const uploads: SavedProgress[] = []
      vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
        if (input.endsWith('/health')) return health()
        if (input.endsWith('/auth/me')) return json({ username: 'keeper01' })
        if (input.endsWith('/save') && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { progress: SavedProgress }
          uploads.push(body.progress)
          return json({ progress: body.progress, revision: 2, updatedAt: 201 })
        }
        return json({ progress: remote, revision: 1, updatedAt: 200 })
      }))
      const account = useAccountStore()
      await account.initialize()
      await vi.advanceTimersByTimeAsync(750)
      expect(account.syncState).toBe('synced')
      expect(archive.getRecord('shoes').status).toBe('investigating')
      expect(archive.getRecord('battery').status).toBe('archived')
      expect(uploads).toHaveLength(1)
      expect(uploads[0].contentVersion).toBe('independent-chapters-v6')
      expect(uploads[0].legacyShoesRecord?.foundClueIds).toEqual(['shoes-patch'])
    } finally {
      vi.useRealTimers()
    }
  })

  it('v5云存档只重开未完成的饭碗章，旧线索随v6上传保留', async () => {
    vi.useFakeTimers()
    try {
      const archive = useArchiveStore()
      const oldBowl = { ...archive.getRecord('bowl'), status: 'investigating' as const,
        foundClueIds: ['bowl-note'], evidenceVerified: true, historyRevealed: true }
      const remote: SavedProgress = { ...archive.exportProgress(), contentVersion: 'independent-chapters-v5', records: {
        list: { ...archive.getRecord('list'), status: 'archived' },
        map: { ...archive.getRecord('map'), status: 'archived' },
        battery: { ...archive.getRecord('battery'), status: 'archived' },
        shoes: { ...archive.getRecord('shoes'), status: 'archived' },
        bowl: oldBowl,
      } }
      const uploads: SavedProgress[] = []
      vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
        if (input.endsWith('/health')) return health()
        if (input.endsWith('/auth/me')) return json({ username: 'keeper01' })
        if (input.endsWith('/save') && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { progress: SavedProgress }
          uploads.push(body.progress)
          return json({ progress: body.progress, revision: 2, updatedAt: 201 })
        }
        return json({ progress: remote, revision: 1, updatedAt: 200 })
      }))
      const account = useAccountStore()
      await account.initialize()
      await vi.advanceTimersByTimeAsync(750)
      expect(account.syncState).toBe('synced')
      expect(archive.getRecord('shoes').status).toBe('archived')
      expect(archive.getRecord('bowl').status).toBe('investigating')
      expect(archive.getRecord('bowl').foundClueIds).toEqual([])
      expect(uploads).toHaveLength(1)
      expect(uploads[0].contentVersion).toBe('independent-chapters-v6')
      expect(uploads[0].legacyBowlRecord?.foundClueIds).toEqual(['bowl-note'])
    } finally { vi.useRealTimers() }
  })

  it('账号已创建但首次存档失败时保留身份，并允许重试完成保存', async () => {
    let failSave = true
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/register')) return json({ username: 'keeper01' }, 201)
      if (input.endsWith('/save') && init?.method === 'PUT') {
        if (failSave) return new Response('Bad Gateway', { status: 502 })
        const body = JSON.parse(String(init.body)) as { progress: SavedProgress }
        return json({ progress: body.progress, revision: 1, updatedAt: 100 })
      }
      return json({ progress: null, revision: 0, updatedAt: null })
    }))
    const account = useAccountStore()
    expect(await account.authenticate('register', 'keeper01', 'long-password')).toBe(false)
    expect(account.username).toBe('keeper01')
    expect(account.cloudReady).toBe(false)
    expect(account.syncState).toBe('offline')
    expect(account.error).toContain('HTTP 502')
    failSave = false
    await account.retry()
    expect(account.cloudReady).toBe(true)
    expect(account.syncState).toBe('synced')
    expect(account.revision).toBe(1)
  })

  it('首次云存档已确认后，后续自动保存失败不撤销阅读资格', async () => {
    vi.useFakeTimers()
    try {
      let failSave = false
      let revision = 0
      vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
        if (input.endsWith('/health')) return health()
        if (input.endsWith('/auth/register')) return json({ username: 'keeper01' }, 201)
        if (input.endsWith('/save') && init?.method === 'PUT') {
          if (failSave) return new Response('Bad Gateway', { status: 502 })
          const body = JSON.parse(String(init.body)) as { progress: SavedProgress }
          return json({ progress: body.progress, revision: ++revision, updatedAt: 100 })
        }
        return json({ progress: null, revision: 0, updatedAt: null })
      }))
      const account = useAccountStore()
      const archive = useArchiveStore()
      expect(await account.authenticate('register', 'keeper01', 'long-password')).toBe(true)
      expect(account.cloudReady).toBe(true)
      failSave = true
      archive.startObject('list')
      await vi.advanceTimersByTimeAsync(750)
      expect(account.syncState).toBe('offline')
      expect(account.cloudReady).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('断线时暂存当前进度，刷新后按原修订号补传到云端', async () => {
    vi.useFakeTimers()
    try {
      const storage = new Map<string, string>()
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => { storage.set(key, value) },
        removeItem: (key: string) => { storage.delete(key) },
      })
      let remote: SavedProgress | null = null
      let revision = 0
      let unavailable = false
      vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
        if (input.endsWith('/health')) return health()
        if (input.endsWith('/auth/register') || input.endsWith('/auth/me')) return json({ username: 'keeper01' })
        if (input.endsWith('/save') && init?.method === 'PUT') {
          if (unavailable) return new Response('Bad Gateway', { status: 502 })
          const body = JSON.parse(String(init.body)) as { progress: SavedProgress; baseRevision: number }
          expect(body.baseRevision).toBe(revision)
          remote = body.progress
          return json({ progress: remote, revision: ++revision, updatedAt: 100 })
        }
        return json({ progress: remote, revision, updatedAt: remote ? 100 : null })
      }))

      const firstAccount = useAccountStore()
      expect(await firstAccount.authenticate('register', 'keeper01', 'long-password')).toBe(true)
      unavailable = true
      useArchiveStore().startObject('list')
      await vi.advanceTimersByTimeAsync(750)
      expect(firstAccount.syncState).toBe('offline')
      expect([...storage.values()].some((value) => value.includes('"investigating"'))).toBe(true)

      setActivePinia(createPinia())
      unavailable = false
      const restoredAccount = useAccountStore()
      await restoredAccount.initialize()
      expect(restoredAccount.syncState).toBe('synced')
      expect(useArchiveStore().getRecord('list').status).toBe('investigating')
      expect((remote as SavedProgress | null)?.records.list.status).toBe('investigating')
      expect(revision).toBe(2)
      expect(storage.size).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('云端修订号变化时保留本机暂存并要求玩家选择', async () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value) },
      removeItem: (key: string) => { storage.delete(key) },
    })
    const localArchive = useArchiveStore()
    localArchive.startObject('list')
    const localProgress = localArchive.exportProgress()
    storage.set('unclaimed-pending-save-v1:keeper01', JSON.stringify({
      username: 'keeper01', baseRevision: 1, progress: localProgress, updatedAt: Date.now(),
    }))
    setActivePinia(createPinia())
    const remote: SavedProgress = { ...localProgress, keeperNumber: '2026-9999' }
    const uploads: unknown[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/me')) return json({ username: 'keeper01' })
      if (init?.method === 'PUT') uploads.push(init.body)
      return json({ progress: remote, revision: 2, updatedAt: 200 })
    }))
    const account = useAccountStore()
    await account.initialize()
    expect(account.syncState).toBe('conflict')
    expect(uploads).toHaveLength(0)
    expect(useArchiveStore().keeperNumber).toBe(localProgress.keeperNumber)
    expect(storage.size).toBe(1)
  })
})
