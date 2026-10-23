<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{
  storyMode?: boolean; storySubject?: string
  cluesFound: number; cluesTotal: number
  claimsReviewed: number; claimsTotal: number
  classifiedCount: number; classifiedTotal: number
  evidenceVerified: boolean; historyRevealed: boolean; historyRead: boolean
  archived?: boolean; nextObjectKey?: string
}>()
const emit = defineEmits<{ reveal: []; organize: [] }>()
const section = ref<HTMLElement | null>(null)
const ready = computed(() => props.cluesFound >= props.cluesTotal)
const title = computed(() => props.archived ? '本章已归档' : props.evidenceVerified ? '故事已保存' : ready.value ? '线索已读齐' : '继续观察物品')
const description = computed(() => props.archived ? '故事与史实已分别保存，可以继续下一件物品。' : props.evidenceVerified ? '接下来翻阅独立史实，保留游戏故事中的未知。' : ready.value ? '整理一条有依据的展签，再打开史实档案。' : `已发现 ${props.cluesFound} / ${props.cluesTotal} 处线索。`)
defineExpose({ scrollIntoView: () => section.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) })
</script>

<template>
  <section ref="section" class="history-gate chapter-completion" :class="{ unlocked: evidenceVerified, read: historyRead }" aria-label="章节进度与后续操作">
    <div class="completion-status"><span class="completion-dot" aria-hidden="true"></span><div><h2>{{ title }}</h2><p>{{ description }}</p></div></div>
    <nav class="completion-actions" aria-label="章节操作">
      <template v-if="archived">
        <button type="button" class="completion-secondary" @click="emit('reveal')">重访史实</button>
        <RouterLink class="completion-primary" :to="nextObjectKey ? { path: '/archive', query: { focus: nextObjectKey } } : '/ending'">{{ nextObjectKey ? '接收下一件物品 →' : '进入终章 →' }}</RouterLink>
      </template>
      <button v-else-if="evidenceVerified" type="button" class="completion-primary" @click="emit('reveal')">翻阅真实史实 →</button>
      <button v-else-if="ready" type="button" class="completion-secondary" @click="emit('organize')">整理展签 →</button>
      <span v-else class="completion-count">{{ cluesFound }} / {{ cluesTotal }}</span>
    </nav>
  </section>
</template>
