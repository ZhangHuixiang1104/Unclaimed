<script setup lang="ts">
import type { HomeArchivePreview } from '../../data/homeArchives'

defineProps<{
  item: HomeArchivePreview
  position: number
  hovered: boolean
  selected: boolean
  archived: boolean
  muted: boolean
}>()

const emit = defineEmits<{
  hover: [key: string | null]
  select: [key: string]
}>()
</script>

<template>
  <button
    class="archive-folder"
    :class="[`folder-${item.material}`, { hovered, selected, archived, muted }]"
    :style="{ '--folder-index': position, '--folder-accent': item.accent, '--folder-rotation': `${(position - 2) * 0.7}deg` }"
    type="button"
    :aria-label="`${item.index} ${item.shortTitle}：${item.teaser}${archived ? '，已归档' : ''}`"
    :aria-pressed="selected"
    @mouseenter="emit('hover', item.key)"
    @mouseleave="emit('hover', null)"
    @focus="emit('hover', item.key)"
    @blur="emit('hover', null)"
    @click="emit('select', item.key)"
  >
    <span class="folder-tab">
      <small>{{ item.index }}</small>
      <strong>{{ item.shortTitle }}</strong>
    </span>
    <span class="folder-paper-detail" aria-hidden="true">
      <i></i><i></i><i></i>
    </span>
    <span class="folder-object-mark" aria-hidden="true">{{ item.silhouette }}</span>
    <span v-if="archived" class="folder-stamp">已存档</span>
  </button>
</template>

