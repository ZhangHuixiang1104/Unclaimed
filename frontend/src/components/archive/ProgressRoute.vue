<script setup lang="ts">
import { archiveObjects } from '../../data/objects'
import { useArchiveStore } from '../../stores/archive'

const archive = useArchiveStore()
</script>

<template>
  <section class="route-strip" aria-label="长征路线整理进度">
    <div class="route-line" aria-hidden="true"></div>
    <RouterLink
      v-for="item in archiveObjects"
      :key="item.key"
      :to="`/object/${item.key}`"
      :class="['route-node', { lit: archive.getRecord(item.key).status === 'archived' }]"
    >
      <span class="node-dot"></span>
      <strong>{{ item.historicalLabel }}</strong>
      <small>{{ archive.getRecord(item.key).status === 'archived' ? '已点亮' : '待整理' }}</small>
    </RouterLink>
  </section>
</template>
