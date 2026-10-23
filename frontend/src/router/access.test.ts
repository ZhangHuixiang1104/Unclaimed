import { describe, expect, it, vi } from 'vitest'
import { canEnterProject, confirmFinalSave } from './access'

describe('档案页的账号守卫', () => {
  it('云存档已确认的玩家，在临时离线或冲突时也不会被翻阅按钮踢回账号页', () => {
    for (const state of ['synced', 'saving', 'offline', 'conflict']) {
      expect(canEnterProject(true, true, state)).toBe(true)
    }
  })

  it('访客、尚未完成首次云存档及旧版迁移仍须留在账号页', () => {
    expect(canEnterProject(false, false, 'guest')).toBe(false)
    expect(canEnterProject(true, false, 'offline')).toBe(false)
    expect(canEnterProject(true, true, 'upgrade')).toBe(false)
  })

  it('终章入口等待进行中的保存，避免点击过快被退回索引', async () => {
    let release!: () => void
    const wait = new Promise<void>(resolve => { release = resolve })
    const account = { syncState: 'saving', pendingUpload: true, saveNow: vi.fn(async () => {
      await wait
      account.syncState = 'synced'; account.pendingUpload = false
      return true
    }) }
    let resolved = false
    const result = confirmFinalSave(true, account).then(value => { resolved = true; return value })
    await Promise.resolve()
    expect(resolved).toBe(false)
    release()
    expect(await result).toBe(true)
  })

  it('未完成五章不会发起终章保存，已同步无需重复保存，离线失败不放行', async () => {
    const saveNow = vi.fn(async () => false)
    const account = { syncState: 'synced', pendingUpload: false, saveNow }
    expect(await confirmFinalSave(false, account)).toBe(false)
    expect(await confirmFinalSave(true, account)).toBe(true)
    expect(saveNow).not.toHaveBeenCalled()
    account.syncState = 'offline'; account.pendingUpload = true
    expect(await confirmFinalSave(true, account)).toBe(false)
    expect(saveNow).toHaveBeenCalledOnce()
  })
})
