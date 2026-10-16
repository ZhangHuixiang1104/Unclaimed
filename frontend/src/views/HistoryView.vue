<script setup lang="ts">
import AppShell from '../components/common/AppShell.vue'
import ProgressRoute from '../components/archive/ProgressRoute.vue'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const archive = useArchiveStore()
</script>

<template>
  <AppShell>
    <section class="page-intro">
      <div>
        <span class="eyebrow">路线档案</span>
        <h1>物件经过的地方，正在重新连成一条路。</h1>
        <p>当前为史实内容填充框架。每个节点应加入时间、地点、背景说明、资料来源与虚构边界。</p>
      </div>
    </section>
    <ProgressRoute />
    <section class="history-list">
      <article v-for="item in archiveObjects" :key="item.key" :class="['history-entry', { unlocked: archive.getRecord(item.key).status === 'archived' }]">
        <span class="history-order">0{{ item.order }}</span>
        <div>
          <span class="eyebrow">{{ item.historicalLabel }}</span>
          <h2>{{ item.name }}</h2>
          <p v-if="archive.getRecord(item.key).status === 'archived'">史实说明占位：正式填入80至120字历史背景，并在资料页给出可核验来源。</p>
          <p v-else>完成物件建档后解锁该段史实回声。</p>
        </div>
        <RouterLink :to="`/object/${item.key}`">{{ archive.getRecord(item.key).status === 'archived' ? '回看档案' : '前往整理' }} →</RouterLink>
      </article>
    </section>
  </AppShell>
</template>
