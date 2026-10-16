<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '../components/common/AppShell.vue'
import { objectByKey } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const archive = useArchiveStore()
const selected = computed(() => objectByKey(archive.selectedObjectKey ?? ''))
const note = computed(() => archive.keeperNote || '请继续为无名者保存真实经历。')
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
          <strong>主人未知 · 经历真实 · 共同保存</strong>
          <span>{{ archive.archivedCount }} 件档案已整理</span>
        </footer>
      </div>
      <p>这张凭证记录了你保存的物品与留言。仍无法确认的姓名，留待未来的材料回答。</p>
      <RouterLink class="secondary-button" to="/archive">返回档案室</RouterLink>
    </section>
  </AppShell>
</template>
