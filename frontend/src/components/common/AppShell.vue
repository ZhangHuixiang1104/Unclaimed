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
        <span class="keeper-id sync-label">{{ account.signedIn ? account.syncState === 'synced' ? '已保存' : account.syncState === 'saving' ? '保存中…' : '存档待同步' : '未登录 · 进度不保留' }}</span>
        <button class="icon-button" type="button" :aria-pressed="settings.soundEnabled" @click="settings.soundEnabled = !settings.soundEnabled">
          {{ settings.soundEnabled ? '声音 开' : '声音 关' }}
        </button>
      </div>
    </header>

    <main :class="['shell-main', `route-${String(route.name ?? 'unknown')}`]">
      <slot />
    </main>
  </div>
</template>
