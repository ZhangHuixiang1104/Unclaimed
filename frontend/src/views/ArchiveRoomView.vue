<script setup lang="ts">
import AppShell from '../components/common/AppShell.vue'
import ObjectCard from '../components/archive/ObjectCard.vue'
import ProgressRoute from '../components/archive/ProgressRoute.vue'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const archive = useArchiveStore()
</script>

<template>
  <AppShell>
    <section class="page-intro archive-intro">
      <div>
        <span class="eyebrow">今晚待整理</span>
        <h1>先看痕迹，再写结论。</h1>
        <p>五件物品使用同一套调查流程。当前框架已准备好数据入口、调查状态、证据分类与本地存档。</p>
      </div>
      <div class="progress-seal">
        <strong>{{ archive.archivedCount }}</strong>
        <span>/ 5 已建档</span>
        <small>{{ archive.progressPercent }}% 完成</small>
      </div>
    </section>

    <ProgressRoute />

    <section class="object-grid" aria-label="待整理物件">
      <ObjectCard v-for="item in archiveObjects" :key="item.key" :item="item" :status="archive.getRecord(item.key).status" />
    </section>

    <section class="archivist-note">
      <span class="note-index">工作便签 01</span>
      <blockquote>“别先问它们属于谁。先问，它们经历过什么。”</blockquote>
      <p>正式版本在此接入程老师录音与字幕。</p>
    </section>

    <div class="archive-footer-actions">
      <button class="text-button danger" type="button" @click="archive.reset">重置框架演示进度</button>
      <RouterLink v-if="archive.endingUnlocked" class="primary-button" to="/ending">进入无人认领终章</RouterLink>
      <span v-else>完成至少四件物品后解锁终章</span>
    </div>
  </AppShell>
</template>
