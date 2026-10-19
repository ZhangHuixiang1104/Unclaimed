<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '../components/common/AppShell.vue'
import { objectByKey } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const archive = useArchiveStore()
const selected = computed(() => objectByKey(archive.selectedObjectKey ?? ''))
const note = computed(() => archive.keeperNote || '把能够确认的留下，把仍未知的留白。')
</script>

<template>
  <AppShell>
    <section class="ticket-page">
      <div class="keeper-ticket">
        <header>
          <span>长征失物招领处</span>
          <small>DIGITAL ARCHIVE</small>
        </header>
        <div class="ticket-main">
          <span class="eyebrow">临时保管员票据</span>
          <h1>第 {{ archive.keeperNumber }} 号</h1>
          <div class="ticket-object">{{ selected?.silhouette ?? '拾' }}</div>
          <h2>{{ selected?.name ?? '无名物件' }}</h2>
          <blockquote>{{ note }}</blockquote>
        </div>
        <footer>
          <strong>姓名留白 · 交接有据 · 史实另存</strong>
          <span>{{ archive.archivedCount }} 件档案已整理</span>
        </footer>
      </div>
      <p>这张凭证记录你整理的原创故事物件与留言，不是文物入藏证明。真实历史资料请在已开放的史实页查阅。</p>
      <RouterLink class="secondary-button" to="/archive">返回档案室</RouterLink>
    </section>
  </AppShell>
</template>
