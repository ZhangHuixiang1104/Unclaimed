import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAccountStore } from './account'
import { useArchiveStore } from './archive'
import type { SavedProgress } from '../services/progress'
import { readPendingSave, writePendingSave } from '../services/pendingSave'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
})
const health = () => json({ status: 'ok', saveContract: 'independent-chapters-v6', identityContract: 'account-bound-v1' })
const memoryStorage = () => {
  const entries = new Map<string, string>()
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value) },
    removeItem: (key: string) => { entries.delete(key) },
    get length() { return entries.size },
    key: (index: number) => [...entries.keys()][index] ?? null,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('localStorage', memoryStorage())
  vi.stubGlobal('sessionStorage', memoryStorage())
})
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
    let remoteRevision = 4
    vi.stubGlobal('fetch', vi.fn(async (input: string) => input.endsWith('/health') ? health()
      : input.endsWith('/auth/me') || input.endsWith('/auth/login') ? json({ username: 'keeper01' })
        : json({ progress: remote, revision: remoteRevision, updatedAt: 200 })))
    const account = useAccountStore()
    await account.initialize()
    expect(account.ready).toBe(true)
    expect(useArchiveStore().keeperNumber).toBe('2026-1234')
    expect(account.revision).toBe(4)
    remoteRevision = 5
    remote.keeperNote = '另一页更新的记录'

    setActivePinia(createPinia())
    const archive = useArchiveStore()
    archive.startObject('list')
    const secondAccount = useAccountStore()
    expect(await secondAccount.authenticate('login', 'keeper01', 'long-password')).toBe(true)
    expect(secondAccount.syncState).toBe('conflict')
    await secondAccount.chooseCloud()
    expect(archive.keeperNumber).toBe('2026-1234')
    expect(Object.keys(archive.records)).toHaveLength(0)
    expect(archive.keeperNote).toBe('另一页更新的记录')
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
    expect(storage.size).toBe(2)
  })

  it('Cookie切到同修订另一账号时停止保存，换号不带入旧进度，原账号可恢复暂存', async () => {
    const archive = useArchiveStore()
    const first = { ...archive.exportProgress(), keeperNumber: '2026-1111' }
    const second = { ...first, keeperNumber: '2026-2222' }
    const remote: Record<string, SavedProgress> = { keeper01: first, keeper02: second }
    let activeUser = ''
    const writes: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/login')) {
        activeUser = JSON.parse(String(init?.body)).username
        return json({ username: activeUser })
      }
      if (input.endsWith('/auth/logout')) return json({ ok: true })
      const expected = new Headers(init?.headers).get('X-Archive-Username')
      if (expected !== activeUser) return json({ detail: '当前登录账号已变更' }, 401)
      if (init?.method === 'PUT') {
        writes.push(activeUser)
        remote[activeUser] = JSON.parse(String(init.body)).progress
      }
      return json({ progress: remote[activeUser], revision: 1, updatedAt: 100 })
    }))
    const account = useAccountStore()
    expect(await account.authenticate('login', 'keeper01', 'long-password')).toBe(true)
    archive.keeperNote = '账号一的新记录'
    activeUser = 'keeper02'
    expect(await account.saveNow()).toBe(false)
    expect(account.signedIn).toBe(false)
    expect(account.syncState).toBe('guest')
    expect(account.reauthUsername).toBe('keeper01')
    expect(readPendingSave('keeper01')?.progress.keeperNote).toBe('账号一的新记录')
    expect(writes).toEqual([])

    expect(await account.authenticate('login', 'keeper02', 'long-password')).toBe(true)
    expect(archive.keeperNumber).toBe('2026-2222')
    expect(archive.keeperNote).toBe('')
    expect(writes).toEqual([])
    await account.logout()
    expect(await account.authenticate('login', 'keeper01', 'long-password')).toBe(true)
    expect(archive.keeperNote).toBe('账号一的新记录')
    expect(remote.keeper02.keeperNote).toBe('')
    expect(writes).toEqual(['keeper01'])
    expect(readPendingSave('keeper01')).toBeNull()
  })

  it('冲突选择读取云端也绑定原账号，身份变化后保留当前档案并重新登录', async () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    const local = archive.exportProgress()
    const remote = { ...local, keeperNumber: '2026-9999' }
    let activeUser = 'keeper01'
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/login')) return json({ username: 'keeper01' })
      expect(new Headers(init?.headers).get('X-Archive-Username')).toBe('keeper01')
      if (activeUser !== 'keeper01') return json({ detail: '当前登录账号已变更' }, 401)
      return json({ progress: remote, revision: 1, updatedAt: 100 })
    }))
    const account = useAccountStore()
    await account.authenticate('login', 'keeper01', 'long-password')
    expect(account.syncState).toBe('conflict')
    activeUser = 'keeper02'
    await account.chooseCloud()
    expect(account.signedIn).toBe(false)
    expect(archive.keeperNumber).toBe(local.keeperNumber)
    expect(readPendingSave('keeper01')?.conflicted).toBe(true)
  })

  it('冲突期间继续调查仍写本页暂存，保留原修订与冲突标记，刷新后恢复', async () => {
    vi.useFakeTimers()
    try {
      const archive = useArchiveStore()
      archive.startObject('list')
      const local = archive.exportProgress()
      const remote = { ...local, keeperNumber: '2026-9999' }
      const writes: unknown[] = []
      vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
        if (input.endsWith('/health')) return health()
        if (input.endsWith('/auth/login') || input.endsWith('/auth/me')) return json({ username: 'keeper01' })
        if (init?.method === 'PUT') writes.push(init.body)
        return json({ progress: remote, revision: 7, updatedAt: 100 })
      }))
      const account = useAccountStore()
      await account.authenticate('login', 'keeper01', 'long-password')
      expect(account.syncState).toBe('conflict')
      archive.keeperNote = '冲突后继续观察'
      archive.completeInteraction('list', 'list-pieces-assembled')
      await vi.advanceTimersByTimeAsync(1000)
      const pending = readPendingSave('keeper01')!
      expect(pending.baseRevision).toBe(7)
      expect(pending.conflicted).toBe(true)
      expect(pending.progress.keeperNote).toBe('冲突后继续观察')
      expect(pending.progress.records.list.completedInteractions).toContain('list-pieces-assembled')
      expect(writes).toEqual([])
      setActivePinia(createPinia())
      const restored = useAccountStore()
      await restored.initialize()
      expect(restored.syncState).toBe('conflict')
      expect(useArchiveStore().keeperNote).toBe('冲突后继续观察')
      expect(writes).toEqual([])
    } finally { vi.useRealTimers() }
  })

  it('离线重试收到401后进入登录，重新认证原账号后补传暂存', async () => {
    let remote: SavedProgress | null = null
    let failure = 0
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/login')) return json({ username: 'keeper01' })
      if (failure) return json({ detail: '连接或登录失效' }, failure)
      if (init?.method === 'PUT') remote = JSON.parse(String(init.body)).progress
      return json({ progress: remote, revision: remote ? 1 : 0, updatedAt: remote ? 100 : null })
    }))
    const account = useAccountStore()
    await account.authenticate('login', 'keeper01', 'long-password')
    useArchiveStore().keeperNote = '重试前的记录'
    failure = 503
    expect(await account.saveNow()).toBe(false)
    expect(account.syncState).toBe('offline')
    failure = 401
    await account.retry()
    expect(account.syncState).toBe('guest')
    expect(account.signedIn).toBe(false)
    expect(readPendingSave('keeper01')?.progress.keeperNote).toBe('重试前的记录')
    failure = 0
    expect(await account.authenticate('login', 'keeper01', 'long-password')).toBe(true)
    expect((remote as SavedProgress | null)?.keeperNote).toBe('重试前的记录')
    expect(account.pendingUpload).toBe(false)
  })

  it('无待上传改动的旧档可暂不迁移退出，云档与本机旧档均保留', async () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    const local = archive.exportProgress()
    const legacy = { ...local, contentVersion: 'legacy-v1' }
    const writes: unknown[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/login')) return json({ username: 'keeper01' })
      if (input.endsWith('/auth/logout')) return json({ ok: true })
      if (init?.method === 'PUT') writes.push(init.body)
      return json({ progress: legacy, revision: 4, updatedAt: 100 })
    }))
    const account = useAccountStore()
    await account.authenticate('login', 'keeper01', 'long-password')
    expect(account.syncState).toBe('upgrade')
    expect(account.pendingUpload).toBe(false)
    await account.logout()
    expect(account.signedIn).toBe(false)
    expect(archive.exportProgress()).toEqual(local)
    expect(writes).toEqual([])
    await account.authenticate('login', 'keeper01', 'long-password')
    expect(account.syncState).toBe('upgrade')
    expect(account.cloudProgress).toEqual(legacy)
  })

  it('旧档仍有未上传暂存时保留退出保护', async () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    const legacy = { ...archive.exportProgress(), contentVersion: 'legacy-v1' }
    writePendingSave({ username: 'keeper01', baseRevision: 4, progress: archive.exportProgress(), updatedAt: 100 })
    vi.stubGlobal('fetch', vi.fn(async (input: string) => input.endsWith('/health') ? health()
      : input.endsWith('/auth/login') ? json({ username: 'keeper01' })
        : json({ progress: legacy, revision: 4, updatedAt: 100 })))
    const account = useAccountStore()
    await account.authenticate('login', 'keeper01', 'long-password')
    expect(account.syncState).toBe('upgrade')
    await expect(account.logout()).rejects.toThrow('当前进度尚未保存')
    expect(readPendingSave('keeper01')).not.toBeNull()
  })

  it('新标签逐份核对其他标签草稿，确认一份后继续保留并呈现下一份', async () => {
    const baseline = useArchiveStore().exportProgress()
    localStorage.setItem('unclaimed-pending-save-v2:keeper01:first-tab', JSON.stringify({
      username: 'keeper01', baseRevision: 5, updatedAt: 1,
      progress: { ...baseline, keeperNote: '较早页面的调查' },
    }))
    localStorage.setItem('unclaimed-pending-save-v2:keeper01:second-tab', JSON.stringify({
      username: 'keeper01', baseRevision: 5, updatedAt: 2,
      progress: { ...baseline, keeperNote: '较新页面的调查' },
    }))
    let remote = baseline
    let revision = 5
    const writes: SavedProgress[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/login')) return json({ username: 'keeper01' })
      if (init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { progress: SavedProgress; baseRevision: number }
        expect(body.baseRevision).toBe(revision)
        remote = body.progress
        writes.push(remote)
        revision++
      }
      return json({ progress: remote, revision, updatedAt: 100 })
    }))
    const account = useAccountStore()
    await account.authenticate('login', 'keeper01', 'long-password')
    expect(account.syncState).toBe('conflict')
    expect(useArchiveStore().keeperNote).toBe('较新页面的调查')
    expect(writes).toEqual([])
    await account.chooseCurrent()
    expect(writes).toHaveLength(1)
    expect(remote.keeperNote).toBe('较新页面的调查')
    expect(account.syncState).toBe('conflict')
    expect(useArchiveStore().keeperNote).toBe('较早页面的调查')
    expect(readPendingSave('keeper01')?.baseRevision).toBe(5)
    await account.chooseCloud()
    expect(account.syncState).toBe('synced')
    expect(useArchiveStore().keeperNote).toBe('较新页面的调查')
    expect(account.pendingUpload).toBe(false)
    expect(readPendingSave('keeper01')).toBeNull()
  })

  it('恢复外页草稿后暂存失败，重连和409核对均保留内存中的新操作', async () => {
    const archive = useArchiveStore()
    archive.startObject('list')
    const local = archive.exportProgress()
    archive.reset()
    localStorage.setItem('unclaimed-pending-save-v2:keeper01:source', JSON.stringify({
      username: 'keeper01', baseRevision: 1, updatedAt: 100, progress: local,
    }))
    const remote = { ...local, keeperNumber: '2026-9999' }
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith('/health')) return health()
      if (input.endsWith('/auth/me')) return json({ username: 'keeper01' })
      if (init?.method === 'PUT') return json({ detail: '存档冲突' }, 409)
      return json({ progress: remote, revision: 2, updatedAt: 200 })
    }))
    const account = useAccountStore()
    await account.initialize()
    expect(account.syncState).toBe('conflict')
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError') })
    archive.completeInteraction('list', 'list-pieces-assembled')
    archive.keeperNote = '暂存失败后继续观察'
    expect(account.pendingSafe).toBe(false)
    await account.retry()
    expect(archive.getRecord('list').completedInteractions).toContain('list-pieces-assembled')
    expect(archive.keeperNote).toBe('暂存失败后继续观察')
    archive.keeperNote = '冲突后仍保留的新记录'
    await account.chooseCurrent()
    expect(account.syncState).toBe('conflict')
    expect(archive.keeperNote).toBe('冲突后仍保留的新记录')
  })
})
