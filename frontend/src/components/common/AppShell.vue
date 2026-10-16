<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useArchiveStore } from '../../stores/archive'
import { useSettingsStore } from '../../stores/settings'

const route = useRoute()
const archive = useArchiveStore()
const settings = useSettingsStore()
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/archive" aria-label="返回档案室">
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
      </nav>

      <div class="topbar-actions">
        <span class="keeper-id">档案员 {{ archive.keeperNumber }}</span>
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
