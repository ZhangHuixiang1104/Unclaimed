<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useArchiveStore } from '../../stores/archive'
import { useSettingsStore } from '../../stores/settings'
import { useAccountStore } from '../../stores/account'

const route = useRoute()
const archive = useArchiveStore()
const settings = useSettingsStore()
const account = useAccountStore()
</script>

<template>
  <div :class="['app-shell', `shell-${String(route.name ?? 'unknown')}`]">
    <header class="topbar">
      <RouterLink class="brand" :to="route.name === 'archive' ? '/' : '/archive'" :aria-label="route.name === 'archive' ? '返回首页' : '返回档案室'">
        <span class="brand-mark">拾</span>
        <span>
          <strong>长征失物招领处</strong>
          <small>数字档案箱 LZ-1936-07</small>
        </span>
      </RouterLink>

      <nav class="main-nav" aria-label="主要导航">
        <RouterLink to="/archive">档案室</RouterLink>
        <RouterLink to="/history">路线档案</RouterLink>
        <RouterLink to="/about">作品说明</RouterLink>
        <RouterLink to="/account">账号存档</RouterLink>
      </nav>

      <div class="topbar-actions">
        <span class="keeper-id">档案员 {{ archive.keeperNumber }}</span>
        <span class="keeper-id sync-label">{{ account.signedIn ? account.syncState === 'synced' && !account.pendingUpload ? '云端已保存' : account.syncState === 'saving' ? '保存中…' : account.pendingSafe && account.pendingUpload ? '本机暂存 · 待同步' : '存档待同步' : '未登录 · 进度不保留' }}</span>
        <button class="icon-button" type="button" :aria-pressed="settings.soundEnabled" @click="settings.soundEnabled = !settings.soundEnabled">
          {{ settings.soundEnabled ? '声音 开' : '声音 关' }}
        </button>
      </div>
    </header>

    <div v-if="route.name !== 'account' && (account.syncState === 'offline' || account.syncState === 'conflict')" class="save-status-warning" role="status">
      <span>{{ account.syncState === 'offline' ? (account.error || '存档服务暂时不可用。') + (account.pendingSafe && account.pendingUpload ? ' 新进度已暂存本机，尚未上传云端。' : ' 浏览器无法暂存新进度，请勿关闭页面。') : '云端与本机存档需要核对；目前没有覆盖任何一份。' }}</span>
      <button v-if="account.syncState === 'offline'" type="button" @click="account.retry()">立即重试 →</button>
      <RouterLink v-else to="/account">核对存档 →</RouterLink>
    </div>

    <main :class="['shell-main', `route-${String(route.name ?? 'unknown')}`]">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.save-status-warning { display: flex; justify-content: center; gap: 16px; padding: 10px 24px; background: #6b332d; color: #f5e9d6; font-size: 13px; line-height: 1.5; }
.save-status-warning a, .save-status-warning button { padding: 0; border: 0; background: transparent; color: #fff2ce; font-size: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
</style>
