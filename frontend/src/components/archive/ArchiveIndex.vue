<script setup lang="ts">
import type { ArchiveObject, ObjectStatus } from '../../types/archive'

defineProps<{
  items: ArchiveObject[]
  activeKey: string
  selectedKey: string
  statusFor: (key: string) => ObjectStatus
}>()

const emit = defineEmits<{
  preview: [key: string | null]
  select: [key: string]
}>()

const statusText = (status: ObjectStatus) => {
  if (status === 'archived') return '已归档'
  if (status === 'investigating') return '调查中'
  if (status === 'locked') return '未开放'
  return '待整理'
}
</script>

<template>
  <aside class="archive-index" aria-label="档案索引">
    <header class="archive-index-heading">
      <span>CASE INDEX</span>
      <strong>箱内档案</strong>
      <small>按路线顺序排列</small>
    </header>

    <div class="archive-index-list">
      <span class="archive-index-line" aria-hidden="true"></span>
      <button
        v-for="item in items"
        :key="item.key"
        class="archive-index-item"
        :class="{
          active: activeKey === item.key,
          selected: selectedKey === item.key,
          archived: statusFor(item.key) === 'archived',
          locked: statusFor(item.key) === 'locked',
        }"
        type="button"
        :aria-pressed="selectedKey === item.key"
        @mouseenter="emit('preview', item.key)"
        @mouseleave="emit('preview', null)"
        @focus="emit('preview', item.key)"
        @blur="emit('preview', null)"
        @click="emit('select', item.key)"
      >
        <span class="index-node" aria-hidden="true"><i></i></span>
        <span class="index-number">{{ String(item.order).padStart(2, '0') }}</span>
        <span class="index-copy">
          <small>{{ statusFor(item.key) === 'archived' ? item.historicalLabel : `第 ${String(item.order).padStart(2, '0')} 份物件` }}</small>
          <strong>{{ item.name.replace(/^被雨水浸过的|^改了四次的|^用布缠过的|^修补了七次的|^有两个刻痕的/, '') }}</strong>
        </span>
        <span class="index-status">{{ statusText(statusFor(item.key)) }}</span>
      </button>
    </div>

    <footer class="archive-index-footer">
      <span>01</span>
      <i></i>
      <span>05</span>
    </footer>
  </aside>
</template>

