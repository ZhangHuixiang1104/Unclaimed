import { describe, expect, it } from 'vitest'
import { canEnterProject } from './access'

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
})
