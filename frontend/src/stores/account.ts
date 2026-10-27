import { computed, nextTick, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ApiError, cloudApi, type CloudSave } from '../services/cloud'
import { clearPendingSave, readPendingSave, writePendingSave, type PendingSave } from '../services/pendingSave'
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
  const reauthUsername = ref<string | null>(null)
  const signedIn = computed(() => username.value !== null)
  let paused = false
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let saving = false
  let saveQueued = false
  let initialization: Promise<void> | null = null
  let progressOwner: string | null = null

  const stopPendingSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = null
    saveQueued = false
  }

  const hasPlayProgress = (progress: SavedProgress) => Object.keys(progress.records).length > 0
  // v3/v4/v5 may contain old battery/shoes/bowl placeholders. Only affected chapters
  // migrate, with the previous records retained in legacy backup fields.
  const isOlderEdition = (progress: SavedProgress) => hasPlayProgress(progress)
    && progress.contentVersion !== CONTENT_VERSION
    && progress.contentVersion !== 'independent-chapters-v3'
    && progress.contentVersion !== 'independent-chapters-v4'
    && progress.contentVersion !== 'independent-chapters-v5'
  const comparableProgress = (progress: SavedProgress) => JSON.stringify({
    contentVersion: progress.contentVersion ?? 'legacy-v1',
    keeperNumber: progress.keeperNumber,
    records: progress.records,
    legacyBatteryRecord: progress.legacyBatteryRecord ?? null,
    legacyShoesRecord: progress.legacyShoesRecord ?? null,
    legacyBowlRecord: progress.legacyBowlRecord ?? null,
    selectedObjectKey: progress.selectedObjectKey ?? null,
    keeperNote: progress.keeperNote ?? '',
    createdAt: progress.createdAt,
  }, (_, value: unknown) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([first], [second]) => first.localeCompare(second)))
    : value)
  const sameProgress = (first: SavedProgress | null, second: SavedProgress) =>
    first !== null && comparableProgress(first) === comparableProgress(second)

  const rememberProgress = (progress = archive.exportProgress(), baseRevision?: number, conflicted?: boolean,
    previous = username.value ? readPendingSave(username.value, true) : null) => {
    if (!username.value) return null
    const pending = {
      username: username.value,
      baseRevision: baseRevision ?? previous?.baseRevision ?? revision.value,
      progress,
      updatedAt: Date.now(),
      conflicted: conflicted ?? previous?.conflicted ?? false,
      ...(previous?.legacySnapshot ? { legacySnapshot: previous.legacySnapshot } : {}),
      ...(previous?.recoveredFrom ? { recoveredFrom: previous.recoveredFrom } : {}),
    }
    pendingSafe.value = writePendingSave(pending)
    pendingUpload.value = true
    return pending
  }

  const handleFailure = (cause: unknown, fallback: string) => {
    if (cause instanceof ApiError && cause.status === 401) {
      if (username.value && syncState.value !== 'upgrade') rememberProgress()
      reauthUsername.value = username.value ?? progressOwner
      username.value = null
      cloudReady.value = false
      stopPendingSave()
      syncState.value = 'guest'
      error.value = reauthUsername.value
        ? '登录已过期或账号已切换，请重新登录。原账号进度已保留在当前页面。'
        : cause.message
    } else {
      syncState.value = 'offline'
      error.value = cause instanceof Error ? cause.message : fallback
    }
  }

  const assertIdentity = (expectedUsername: string) => {
    if (username.value !== expectedUsername) throw new ApiError('账号已切换，请重新登录。', 401)
  }

  const useIdentity = async (name: string) => {
    if (progressOwner && progressOwner !== name) {
      if (pendingUpload.value && !pendingSafe.value) {
        throw new Error('原账号进度尚未成功暂存，请先登录原账号完成保存。')
      }
      paused = true
      archive.reset()
      await nextTick()
      paused = false
      revision.value = 0
      cloudProgress.value = null
      cloudUpdatedAt.value = null
    }
    username.value = name
    progressOwner = name
    reauthUsername.value = null
  }

  const applyCloud = async (save: CloudSave) => {
    const expectedUsername = username.value
    const pending = expectedUsername ? readPendingSave(expectedUsername) : null
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
    else archive.reset()
    await nextTick()
    paused = false
    if (expectedUsername) assertIdentity(expectedUsername)
    const cleared = !pending || clearPendingSave(pending)
    pendingSafe.value = true
    pendingUpload.value = expectedUsername ? readPendingSave(expectedUsername) !== null : false
    cloudReady.value = true
    syncState.value = 'synced'
    error.value = ''
    if (cleared && pendingUpload.value) await reconcile()
    else if (save.progress && !sameProgress(save.progress, archive.exportProgress())) scheduleSave()
  }

  const upload = async (progress: SavedProgress, previous?: PendingSave) => {
    const expectedUsername = username.value
    if (!expectedUsername) throw new ApiError('请重新登录。', 401)
    const pending = rememberProgress(progress, undefined, undefined, previous)
    const save = await cloudApi.putSave(progress, revision.value, expectedUsername)
    assertIdentity(expectedUsername)
    revision.value = save.revision
    cloudProgress.value = save.progress
    cloudUpdatedAt.value = save.updatedAt
    let cleared = false
    if (sameProgress(archive.exportProgress(), progress)) {
      cleared = !pending || clearPendingSave(pending)
      pendingUpload.value = readPendingSave(expectedUsername) !== null
      pendingSafe.value = true
    } else {
      rememberProgress(archive.exportProgress(), save.revision, false)
    }
    cloudReady.value = true
    syncState.value = 'synced'
    error.value = ''
    if (cleared && pendingUpload.value) await reconcile()
  }

  const reconcile = async () => {
    const expectedUsername = username.value
    if (!expectedUsername) throw new ApiError('请重新登录。', 401)
    const remote = await cloudApi.getSave(expectedUsername)
    assertIdentity(expectedUsername)
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
      const current = hasPlayProgress(local) && (!pending.recoveredFrom || !pendingSafe.value)
        ? local : pending.progress
      if (isOlderEdition(current)) {
        syncState.value = 'upgrade'
        error.value = '本机暂存的是旧版进度，尚未覆盖云端。'
        return
      }
      paused = true
      archive.replaceProgress(current)
      await nextTick()
      paused = false
      const migrated = archive.exportProgress()
      if (sameProgress(remote.progress, migrated)) {
        await applyCloud(remote)
      } else if (!pending.conflicted && remote.revision === pending.baseRevision) {
        await upload(migrated, pending)
      } else {
        rememberProgress(migrated, pending.baseRevision, true, pending)
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
      await useIdentity(me.username)
      await reconcile()
    } catch (cause) {
      if (username.value && hasPlayProgress(archive.exportProgress())) rememberProgress()
      handleFailure(cause, '存档服务暂时不可用。')
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
      await useIdentity(result.username)
      await reconcile()
      return true
    } catch (cause) {
      if (username.value && hasPlayProgress(archive.exportProgress())) rememberProgress()
      handleFailure(cause, '登录失败。')
      if (!username.value) syncState.value = 'guest'
      return false
    }
  }

  const chooseCloud = async () => {
    if (!username.value) return
    const expectedUsername = username.value
    try {
      const remote = await cloudApi.getSave(expectedUsername)
      assertIdentity(expectedUsername)
      await applyCloud(remote)
    } catch (cause) { handleFailure(cause, '读取云端存档失败。') }
  }

  const chooseCurrent = async () => {
    try {
      syncState.value = 'saving'
      await upload(archive.exportProgress())
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        try { await reconcile() } catch (failure) { handleFailure(failure, '保存失败。') }
      } else {
        handleFailure(cause, '保存失败。')
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
      handleFailure(cause, '新版存档创建失败，旧版仍在云端。')
      if (username.value) syncState.value = 'upgrade'
      return false
    }
  }

  const flushSave = async () => {
    if (!username.value || paused || syncState.value === 'conflict' || syncState.value === 'upgrade') return
    if (readPendingSave(username.value, true)?.conflicted) { syncState.value = 'conflict'; return }
    if (saving) { saveQueued = true; return }
    saving = true
    syncState.value = 'saving'
    const snapshot = archive.exportProgress()
    rememberProgress(snapshot)
    try {
      await upload(snapshot)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        try { await reconcile() } catch (failure) { handleFailure(failure, '自动保存失败。') }
      } else {
        handleFailure(cause, '自动保存失败。')
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
    if (!username.value || paused || syncState.value === 'upgrade') return
    const pending = rememberProgress()
    if (syncState.value === 'conflict' || pending?.conflicted) {
      syncState.value = 'conflict'
      stopPendingSave()
      return
    }
    if (syncState.value !== 'offline') syncState.value = 'saving'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saveTimer = null; void flushSave() }, 700)
  }

  watch(
    () => JSON.stringify({ keeperNumber: archive.keeperNumber, records: archive.records, legacyBatteryRecord: archive.legacyBatteryRecord, legacyShoesRecord: archive.legacyShoesRecord, legacyBowlRecord: archive.legacyBowlRecord, selectedObjectKey: archive.selectedObjectKey, keeperNote: archive.keeperNote, createdAt: archive.createdAt }),
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
      handleFailure(cause, '连接失败。')
    }
  }

  const saveNow = async () => {
    if (!username.value || syncState.value === 'conflict' || syncState.value === 'upgrade') return false
    stopPendingSave()
    // An autosave may already be in flight. Wait for it before taking the
    // requested snapshot; otherwise saveNow could report success too early.
    for (let attempt = 0; saving && attempt < 100; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    if (saving) return false
    for (let attempt = 0; attempt < 3; attempt++) {
      stopPendingSave()
      await flushSave()
      if (syncState.value === 'synced' && !pendingUpload.value) return true
      if (syncState.value === 'offline') return false
    }
    return false
  }

  const logout = async () => {
    const leaveOldEdition = syncState.value === 'upgrade' && !pendingUpload.value
    if ((!leaveOldEdition && syncState.value !== 'synced') || (username.value && readPendingSave(username.value))) {
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
    if (!leaveOldEdition) archive.reset()
  }

  return { username, ready, signedIn, cloudReady, syncState, error, revision, cloudProgress, cloudUpdatedAt, pendingSafe, pendingUpload, reauthUsername,
    initialize, authenticate, chooseCloud, chooseCurrent, startNewEdition, retry, saveNow, logout }
})
