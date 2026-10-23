<script setup lang="ts">
import { computed } from 'vue'
import type { ArchiveObject, ObjectRecord } from '../../types/archive'

const props = defineProps<{ item: ArchiveObject; record: ObjectRecord; state: 'sealed' | 'available' | 'investigating' | 'ready' | 'complete' }>()
const action = computed(() => props.state === 'complete' ? '打开史实档案'
  : props.state === 'sealed' ? '返回档案室'
  : props.record.historyRevealed ? '继续阅读史实'
  : props.state === 'available' ? '接收这件物品' : '继续物件调查')
const target = computed(() => props.state === 'sealed' ? '/archive'
  : props.state === 'complete' || props.record.historyRevealed ? `/history/${props.item.key}` : `/object/${props.item.key}`)
const description = computed(() => props.state === 'sealed' ? '完成前一章的调查与史实建档后开放。'
  : props.state === 'complete' ? props.item.historicalLabel
  : props.record.historyRevealed ? '故事已保存，继续阅读本章的四份史实材料。'
  : props.record.evidenceVerified ? '故事已保存，可从检查台打开独立史实。'
  : '观察物品，整理线索，再翻阅关联史实。')
</script>

<template>
  <section class="route-selection" aria-live="polite" aria-label="所选章节">
    <span class="route-selection-label">第 {{ String(item.order).padStart(2, '0') }} 章 · {{ state === 'complete' ? '史实已归档' : '物品与故事' }}</span>
    <h2>{{ item.name }}</h2>
    <p>{{ description }}</p>
    <div class="route-selection-actions">
      <RouterLink class="route-selection-primary" :to="target">{{ action }} <span>→</span></RouterLink>
      <RouterLink v-if="state === 'complete'" class="route-selection-secondary" :to="`/object/${item.key}`">回看调查 ↗</RouterLink>
    </div>
  </section>
</template>
