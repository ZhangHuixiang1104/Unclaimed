import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAccountStore } from './account'
import { useArchiveStore } from './archive'
import type { SavedProgress } from '../services/progress'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
})

beforeEach(() => { setActivePinia(createPinia()) })

describe('账号与云端进度', () => {
  it('注册后把当前页面进度上传到新账号', async () => {
    const requests: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      requests.push(`${init?.method ?? 'GET'} ${input}`)
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
    expect(account.syncState).toBe('synced')
    expect(requests).toEqual(['POST /api/v1/auth/register', 'GET /api/v1/save', 'PUT /api/v1/save'])
  })

  it('打开页面时读取已有云端存档，当前页面进度冲突时等待玩家选择', async () => {
    const remote: SavedProgress = {
      keeperNumber: '2026-1234', records: {}, createdAt: '2026-10-16T00:00:00.000Z',
    }
    vi.stubGlobal('fetch', vi.fn(async (input: string) => input.endsWith('/auth/me') || input.endsWith('/auth/login')
      ? json({ username: 'keeper01' })
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
    expect(secondAccount.syncState).toBe('synced')
    expect(archive.keeperNumber).toBe('2026-1234')
    expect(Object.keys(archive.records)).toHaveLength(0)
  })
})
