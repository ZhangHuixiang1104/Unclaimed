import { computed, nextTick, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ApiError, cloudApi, type CloudSave } from '../services/cloud'
import type { SavedProgress } from '../services/progress'
import { useArchiveStore } from './archive'

type SyncState = 'loading' | 'guest' | 'synced' | 'saving' | 'offline' | 'conflict'

export const useAccountStore = defineStore('account', () => {
  const archive = useArchiveStore()
  const username = ref<string | null>(null)
  const ready = ref(false)
  const syncState = ref<SyncState>('loading')
  const error = ref('')
  const revision = ref(0)
  const cloudProgress = ref<SavedProgress | null>(null)
  const cloudUpdatedAt = ref<number | null>(null)
  const signedIn = computed(() => username.value !== null)
  let paused = false
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let saving = false
  let saveQueued = false
  let initialization: Promise<void> | null = null

  const stopPendingSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = null
    saveQueued = false
  }

  const hasPlayProgress = (progress: SavedProgress) => Object.keys(progress.records).length > 0

  const applyCloud = async (save: CloudSave) => {
    paused = true
    stopPendingSave()
    revision.value = save.revision
    cloudProgress.value = save.progress
    cloudUpdatedAt.value = save.updatedAt
    if (save.progress) archive.replaceProgress(save.progress)
    await nextTick()
    paused = false
    syncState.value = 'synced'
    error.value = ''
  }

  const upload = async (progress: SavedProgress) => {
    const save = await cloudApi.putSave(progress, revision.value)
    revision.value = save.revision
    cloudProgress.value = save.progress
    cloudUpdatedAt.value = save.updatedAt
    syncState.value = 'synced'
    error.value = ''
  }

  const reconcile = async () => {
    const remote = await cloudApi.getSave()
    const local = archive.exportProgress()
    revision.value = remote.revision
    cloudProgress.value = remote.progress
    cloudUpdatedAt.value = remote.updatedAt
    if (remote.progress && hasPlayProgress(local) && JSON.stringify(remote.progress) !== JSON.stringify(local)) {
      syncState.value = 'conflict'
      return
    }
    if (remote.progress) {
      await applyCloud(remote)
      return
    }
    await upload(local)
  }

  const initialize = () => {
    if (ready.value) return Promise.resolve()
    if (initialization) return initialization
    initialization = (async () => {
    syncState.value = 'loading'
    try {
      const me = await cloudApi.me()
      username.value = me.username
      await reconcile()
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        username.value = null
        syncState.value = 'guest'
      } else {
        syncState.value = 'offline'
        error.value = cause instanceof Error ? cause.message : '存档服务暂时不可用。'
      }
    } finally {
      ready.value = true
      initialization = null
    }
    })()
    return initialization
  }

  const authenticate = async (mode: 'register' | 'login', name: string, password: string) => {
    stopPendingSave()
    syncState.value = 'loading'
    error.value = ''
    try {
      const result = await cloudApi[mode](name, password)
      username.value = result.username
      await reconcile()
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '登录失败。'
      syncState.value = username.value ? 'offline' : 'guest'
      return false
    }
  }

  const chooseCloud = async () => {
    if (!cloudProgress.value) return
    await applyCloud({ progress: cloudProgress.value, revision: revision.value, updatedAt: cloudUpdatedAt.value })
  }

  const chooseCurrent = async () => {
    try {
      syncState.value = 'saving'
      await upload(archive.exportProgress())
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        await reconcile()
      } else {
        syncState.value = 'offline'
        error.value = cause instanceof Error ? cause.message : '保存失败。'
      }
    }
  }

  const flushSave = async () => {
    if (!username.value || paused || syncState.value === 'conflict') return
    if (saving) { saveQueued = true; return }
    saving = true
    syncState.value = 'saving'
    const snapshot = archive.exportProgress()
    try {
      await upload(snapshot)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        try { await reconcile() } catch { syncState.value = 'offline' }
      } else {
        syncState.value = 'offline'
        error.value = cause instanceof Error ? cause.message : '自动保存失败。'
      }
    } finally {
      saving = false
      if (saveQueued || JSON.stringify(snapshot) !== JSON.stringify(archive.exportProgress())) {
        saveQueued = false
        scheduleSave()
      }
    }
  }

  const scheduleSave = () => {
    if (!username.value || paused || syncState.value === 'conflict') return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saveTimer = null; void flushSave() }, 700)
  }

  watch(
    () => JSON.stringify({ keeperNumber: archive.keeperNumber, records: archive.records, selectedObjectKey: archive.selectedObjectKey, keeperNote: archive.keeperNote, createdAt: archive.createdAt }),
    () => { if (!paused) scheduleSave() },
  )

  const retry = async () => {
    if (!username.value) return initialize()
    syncState.value = 'loading'
    try { await reconcile() }
    catch (cause) {
      syncState.value = 'offline'
      error.value = cause instanceof Error ? cause.message : '连接失败。'
    }
  }

  const logout = async () => {
    stopPendingSave()
    await cloudApi.logout()
    username.value = null
    revision.value = 0
    cloudProgress.value = null
    cloudUpdatedAt.value = null
    syncState.value = 'guest'
    error.value = ''
    archive.reset()
  }

  return { username, ready, signedIn, syncState, error, revision, cloudProgress, cloudUpdatedAt,
    initialize, authenticate, chooseCloud, chooseCurrent, retry, logout }
})
