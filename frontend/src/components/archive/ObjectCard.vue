<script setup lang="ts">
import type { ArchiveObject, ObjectStatus } from '../../types/archive'

defineProps<{
  item: ArchiveObject
  status: ObjectStatus
}>()
</script>

<template>
  <RouterLink class="object-card" :to="`/object/${item.key}`" :style="{ '--object-accent': item.accent }">
    <div class="object-index">0{{ item.order }}</div>
    <div class="object-silhouette" aria-hidden="true">{{ item.silhouette }}</div>
    <div class="object-copy">
      <span class="status-chip" :class="status">
        {{ status === 'archived' ? '已建档' : status === 'investigating' ? '调查中' : '待整理' }}
      </span>
      <h3>{{ item.name }}</h3>
      <p>{{ item.subtitle }}</p>
      <small>{{ item.archiveNo }}</small>
    </div>
    <span class="card-arrow">进入检查台 ↗</span>
  </RouterLink>
</template>
