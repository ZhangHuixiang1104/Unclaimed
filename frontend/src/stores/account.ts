import { computed, nextTick, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ApiError, cloudApi, type CloudSave } from '../services/cloud'
import { clearPendingSave, readPendingSave, writePendingSave } from '../services/pendingSave'
import { CONTENT_VERSION, type SavedProgress } from '../services/progress'
import { useArchiveStore } from './archive'

type SyncState = 'loading' | 'guest' | 'synced' | 'saving' | 'offline' | 'conflict' | 'upgrade'

export const useAccountStore = defineStore('account', () => {
  const archive = useArchiveStore()
  const username = ref<string | null>(null)
  const ready = ref(false)
  // A temporary save failure must not revoke an already verified session.
  // Fresh/failed registrations still have to confirm a cloud save first.
  const cloudReady = ref(false)
  const syncState = ref<SyncState>('loading')
  const error = ref('')
  const revision = ref(0)
  const cloudProgress = ref<SavedProgress | null>(null)
  const cloudUpdatedAt = ref<number | null>(null)
  const pendingSafe = ref(true)
  const pendingUpload = ref(false)
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
  const isOlderEdition = (progress: SavedProgress) => hasPlayProgress(progress) && progress.contentVersion !== CONTENT_VERSION
  const comparableProgress = (progress: SavedProgress) => JSON.stringify({
    contentVersion: progress.contentVersion ?? 'legacy-v1',
    keeperNumber: progress.keeperNumber,
    records: progress.records,
    selectedObjectKey: progress.selectedObjectKey ?? null,
    keeperNote: progress.keeperNote ?? '',
    createdAt: progress.createdAt,
  }, (_, value: unknown) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([first], [second]) => first.localeCompare(second)))
    : value)
  const sameProgress = (first: SavedProgress | null, second: SavedProgress) =>
    first !== null && comparableProgress(first) === comparableProgress(second)

  const rememberProgress = (progress = archive.exportProgress(), baseRevision?: number, conflicted?: boolean) => {
    if (!username.value) return
    const previous = readPendingSave(username.value)
    pendingSafe.value = writePendingSave({
      username: username.value,
      baseRevision: baseRevision ?? previous?.baseRevision ?? revision.value,
      progress,
      updatedAt: Date.now(),
      conflicted: conflicted ?? previous?.conflicted ?? false,
    })
    pendingUpload.value = true
  }

  const applyCloud = async (save: CloudSave) => {
    paused = true
    stopPendingSave()
    revision.value = save.revision
    cloudProgress.value = save.progress
    cloudUpdatedAt.value = save.updatedAt
    if (save.progress && isOlderEdition(save.progress)) {
      paused = false
      syncState.value = 'upgrade'
      error.value = '旧版线索与新版剧情不兼容；旧存档已保留在云端，尚未覆盖。'
      return
    }
    if (save.progress) archive.replaceProgress(save.progress)
    await nextTick()
    paused = false
    if (username.value) clearPendingSave(username.value)
    pendingSafe.value = true
    pendingUpload.value = false
    cloudReady.value = true
    syncState.value = 'synced'
    error.value = ''
  }

  const upload = async (progress: SavedProgress) => {
    rememberProgress(progress)
    const save = await cloudApi.putSave(progress, revision.value)
    revision.value = save.revision
    cloudProgress.value = save.progress
    cloudUpdatedAt.value = save.updatedAt
    if (username.value) {
      if (sameProgress(archive.exportProgress(), progress)) {
        clearPendingSave(username.value)
        pendingUpload.value = false
        pendingSafe.value = true
      } else {
        rememberProgress(archive.exportProgress(), save.revision)
      }
    }
    cloudReady.value = true
    syncState.value = 'synced'
    error.value = ''
  }

  const reconcile = async () => {
    const remote = await cloudApi.getSave()
    const local = archive.exportProgress()
    const pending = username.value ? readPendingSave(username.value) : null
    pendingUpload.value = pending !== null
    revision.value = remote.revision
    cloudProgress.value = remote.progress
    cloudUpdatedAt.value = remote.updatedAt
    if (remote.progress && isOlderEdition(remote.progress)) {
      stopPendingSave()
      syncState.value = 'upgrade'
      error.value = '旧版线索与新版剧情不兼容；旧存档已保留在云端，尚未覆盖。'
      return
    }
    if (pending) {
      const current = hasPlayProgress(local) && !sameProgress(local, pending.progress) ? local : pending.progress
      if (isOlderEdition(current)) {
        syncState.value = 'upgrade'
        error.value = '本机暂存的是旧版进度，尚未覆盖云端。'
        return
      }
      paused = true
      archive.replaceProgress(current)
      await nextTick()
      paused = false
      if (sameProgress(remote.progress, current)) {
        await applyCloud(remote)
      } else if (!pending.conflicted && remote.revision === pending.baseRevision) {
        await upload(current)
      } else {
        rememberProgress(current, pending.baseRevision, true)
        syncState.value = 'conflict'
        error.value = '云端与本机都有更新，尚未覆盖任一份进度。'
      }
      return
    }
    if (remote.progress && hasPlayProgress(local) && !sameProgress(remote.progress, local)) {
      rememberProgress(local, remote.revision, true)
      syncState.value = 'conflict'
      return
    }
    if (remote.progress) {
      await applyCloud(remote)
      return
    }
    await upload(local)
  }

  const initialize = (force = false) => {
    if (ready.value && !force) return Promise.resolve()
    if (initialization) return initialization
    initialization = (async () => {
    cloudReady.value = false
    syncState.value = 'loading'
    try {
      await cloudApi.checkCompatibility()
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
        if (username.value && hasPlayProgress(archive.exportProgress())) rememberProgress()
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
    cloudReady.value = false
    syncState.value = 'loading'
    error.value = ''
    try {
      await cloudApi.checkCompatibility()
      const result = await cloudApi[mode](name, password)
      username.value = result.username
      await reconcile()
      return true
    } catch (cause) {
      if (username.value && hasPlayProgress(archive.exportProgress())) rememberProgress()
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

  const startNewEdition = async () => {
    if (syncState.value !== 'upgrade' || !cloudProgress.value) return false
    try {
      paused = true
      archive.reset()
      await nextTick()
      paused = false
      syncState.value = 'saving'
      await upload(archive.exportProgress())
      return true
    } catch (cause) {
      paused = false
      syncState.value = 'upgrade'
      error.value = cause instanceof Error ? cause.message : '新版存档创建失败，旧版仍在云端。'
      return false
    }
  }

  const flushSave = async () => {
    if (!username.value || paused || syncState.value === 'conflict' || syncState.value === 'upgrade') return
    if (saving) { saveQueued = true; return }
    saving = true
    syncState.value = 'saving'
    const snapshot = archive.exportProgress()
    rememberProgress(snapshot)
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
      if (saveQueued || !sameProgress(snapshot, archive.exportProgress())) {
        saveQueued = false
        scheduleSave()
      }
    }
  }

  const scheduleSave = () => {
    if (!username.value || paused || syncState.value === 'conflict' || syncState.value === 'upgrade') return
    rememberProgress()
    if (syncState.value !== 'offline') syncState.value = 'saving'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saveTimer = null; void flushSave() }, 700)
  }

  watch(
    () => JSON.stringify({ keeperNumber: archive.keeperNumber, records: archive.records, selectedObjectKey: archive.selectedObjectKey, keeperNote: archive.keeperNote, createdAt: archive.createdAt }),
    () => { if (!paused) scheduleSave() },
    { flush: 'sync' },
  )

  const retry = async () => {
    if (!username.value) return initialize(true)
    stopPendingSave()
    syncState.value = 'loading'
    error.value = ''
    try { await cloudApi.checkCompatibility(); await reconcile() }
    catch (cause) {
      if (hasPlayProgress(archive.exportProgress())) rememberProgress()
      syncState.value = 'offline'
      error.value = cause instanceof Error ? cause.message : '连接失败。'
    }
  }

  const saveNow = async () => {
    if (!username.value || syncState.value === 'conflict' || syncState.value === 'upgrade') return
    stopPendingSave()
    await flushSave()
  }

  const logout = async () => {
    if (syncState.value !== 'synced' || (username.value && readPendingSave(username.value))) {
      throw new Error('当前进度尚未保存。请先重新连接存档服务，确认保存后再退出。')
    }
    stopPendingSave()
    await cloudApi.logout()
    username.value = null
    cloudReady.value = false
    revision.value = 0
    cloudProgress.value = null
    cloudUpdatedAt.value = null
    pendingSafe.value = true
    pendingUpload.value = false
    syncState.value = 'guest'
    error.value = ''
    archive.reset()
  }

  return { username, ready, signedIn, cloudReady, syncState, error, revision, cloudProgress, cloudUpdatedAt, pendingSafe, pendingUpload,
    initialize, authenticate, chooseCloud, chooseCurrent, startNewEdition, retry, saveNow, logout }
})
